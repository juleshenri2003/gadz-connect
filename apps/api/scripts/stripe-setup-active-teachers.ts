/**
 * Crée et complète Stripe Connect pour les professeurs actifs sans paiements configurés.
 * Mode test : onboarding auto (identité + IBAN test). Mode live : crée le compte seulement.
 *
 * Usage:
 *   pnpm --filter @gadz-connect/api stripe-setup-teachers
 *   CAMPUS=Aix pnpm --filter @gadz-connect/api stripe-setup-teachers
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getDemoCampusId } from "./lib/demo-campus.js";
import { ensureStripeConnectAccount } from "../src/lib/stripe-connect-account.js";
import {
  completeStripeTestConnectAccount,
  deleteStripeTestConnectAccount,
  isStripeTestMode,
  readStripeConnectStatus,
} from "../src/lib/stripe-test-connect.js";
import {
  stripe,
  STRIPE_CONNECT_REFRESH_URL,
  STRIPE_CONNECT_RETURN_URL,
} from "../src/lib/stripe.js";

const campusName = process.env.CAMPUS?.trim() || "Aix";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface TeacherRow {
  id: string;
  first_name: string;
  last_name: string;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean | null;
}

async function resolveEmail(userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function main() {
  if (!stripe) {
    console.error("STRIPE_SECRET_KEY manquante dans apps/api/.env");
    process.exit(1);
  }

  const campusId =
    campusName === "Aix"
      ? await getDemoCampusId(admin)
      : (
          await admin
            .from("campus")
            .select("id")
            .eq("name", campusName)
            .maybeSingle()
        ).data?.id;

  if (!campusId) {
    console.error(`Campus « ${campusName} » introuvable`);
    process.exit(1);
  }

  const { data: teachers, error } = await admin
    .from("profiles")
    .select(
      "id, first_name, last_name, stripe_connect_account_id, stripe_connect_onboarding_complete",
    )
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("campus_id", campusId)
    .order("last_name");

  if (error) {
    console.error("profiles:", error.message);
    process.exit(1);
  }

  const rows = (teachers ?? []) as TeacherRow[];
  const toProcess: Array<{ teacher: TeacherRow; reason: string }> = [];

  for (const teacher of rows) {
    if (!teacher.stripe_connect_account_id) {
      toProcess.push({ teacher, reason: "sans compte Stripe" });
      continue;
    }

    const live = readStripeConnectStatus(
      await stripe.accounts.retrieve(teacher.stripe_connect_account_id),
    );

    if (!live.onboardingComplete) {
      toProcess.push({ teacher, reason: "onboarding Stripe incomplet" });
      continue;
    }

    if (teacher.stripe_connect_onboarding_complete !== true) {
      toProcess.push({ teacher, reason: "base désynchronisée" });
      continue;
    }

    if (!live.transfersActive && isStripeTestMode()) {
      toProcess.push({ teacher, reason: "transfers inactifs" });
    }
  }

  console.log(`── Stripe Connect — profs actifs (${campusName}) ──\n`);
  console.log(
    `Mode: ${isStripeTestMode() ? "test (auto-complétion)" : "live (comptes seulement)"}`,
  );
  console.log(
    `${toProcess.length} prof(s) à traiter sur ${rows.length} actif(s)\n`,
  );

  if (toProcess.length === 0) {
    console.log("Rien à faire — tous les profs actifs ont Stripe Connect actif.");
    return;
  }

  let completed = 0;
  let partial = 0;
  let failed = 0;
  const onboardingLinks: Array<{ label: string; url: string }> = [];

  for (const { teacher, reason } of toProcess) {
    const email = await resolveEmail(teacher.id);
    const label = `${teacher.first_name} ${teacher.last_name}`;
    console.log(`── ${label}${email ? ` (${email})` : ""} — ${reason} ──`);

    try {
      let accountId = teacher.stripe_connect_account_id;

      if (
        isStripeTestMode() &&
        accountId &&
        (reason === "onboarding Stripe incomplet" ||
          reason === "transfers inactifs" ||
          reason === "sans compte Stripe")
      ) {
        const deleted = await deleteStripeTestConnectAccount(accountId);
        if (deleted) {
          console.log("  ↻ Compte Stripe test supprimé, recréation propre…");
          await admin
            .from("profiles")
            .update({
              stripe_connect_account_id: null,
              stripe_connect_onboarding_complete: false,
            })
            .eq("id", teacher.id);
          accountId = null;
        }
      }

      const ensured = await ensureStripeConnectAccount({
        userId: teacher.id,
        email: email ?? `${teacher.id}@local.dev`,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        testPrefill: isStripeTestMode(),
      });

      accountId = ensured.accountId;
      if (!accountId) {
        console.log("  ✗ Compte Stripe non créé (API indisponible)");
        failed += 1;
        continue;
      }

      if (ensured.created) {
        console.log("  + Compte créé:", accountId);
      } else {
        console.log("  · Compte existant:", accountId);
      }

      let status = await completeStripeTestConnectAccount(accountId, {
        email: email ?? `${teacher.id}@local.dev`,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
      });

      await admin
        .from("profiles")
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_onboarding_complete: status.onboardingComplete,
        })
        .eq("id", teacher.id);

      if (status.onboardingComplete && status.transfersActive) {
        console.log(
          "  ✓ Connect actif — charges, payouts et transfers OK",
        );
        completed += 1;
      } else if (status.onboardingComplete) {
        console.log(
          "  ~ Onboarding terminé mais transfers pas encore actifs",
        );
        partial += 1;
      } else {
        console.log(
          `  … En attente (charges=${status.chargesEnabled}, payouts=${status.payoutsEnabled})`,
        );
        if (isStripeTestMode()) {
          const link = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: STRIPE_CONNECT_REFRESH_URL,
            return_url: STRIPE_CONNECT_RETURN_URL,
            type: "account_onboarding",
          });
          onboardingLinks.push({ label, url: link.url });
          console.log("  → Lien onboarding généré (1 clic test, ~30 s)");
        } else {
          console.log(
            "    → Mode live : le prof doit finir l'onboarding via /app/paiements",
          );
        }
        partial += 1;
      }
    } catch (err) {
      console.log(
        "  ✗ Erreur:",
        err instanceof Error ? err.message : String(err),
      );
      failed += 1;
    }

    console.log();
  }

  console.log("── Résumé ──");
  console.log(`  ✓ ${completed} complété(s)`);
  if (partial > 0) console.log(`  ~ ${partial} partiel(s)`);
  if (failed > 0) console.log(`  ✗ ${failed} échec(s)`);
  if (onboardingLinks.length > 0) {
    console.log("\n── Liens onboarding (ouvrir dans le navigateur) ──");
    for (const entry of onboardingLinks) {
      console.log(`\n${entry.label}`);
      console.log(entry.url);
    }
    console.log(
      "\nEn mode test : remplir le formulaire Stripe avec des données fictives,",
    );
    console.log("puis revenir sur http://localhost:5173/stripe/return");
  }

  console.log(
    "\nVérifiez /app/paiements côté prof après onboarding.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
