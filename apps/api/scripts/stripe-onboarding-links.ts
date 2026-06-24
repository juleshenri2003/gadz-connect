/**
 * Affiche l'état Stripe Connect et génère des liens d'onboarding pour les profs démo.
 * Usage: pnpm --filter @gadz-connect/api stripe-onboarding-links
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  STRIPE_CONNECT_REFRESH_URL,
  STRIPE_CONNECT_RETURN_URL,
  stripe,
} from "../src/lib/stripe.js";

const DEMO_PROFS = ["prof.dev@ensam.eu", "prof.design@ensam.eu"];

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  if (!stripe) {
    console.error("STRIPE_SECRET_KEY manquante dans apps/api/.env");
    process.exit(1);
  }

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });

  for (const email of DEMO_PROFS) {
    const user = users.users.find((u) => u.email === email);
    if (!user) {
      console.log(`\n✗ ${email} — utilisateur introuvable`);
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select(
        "first_name, last_name, stripe_connect_account_id, stripe_connect_onboarding_complete",
      )
      .eq("id", user.id)
      .single();

    console.log(`\n── ${profile?.first_name} ${profile?.last_name} (${email}) ──`);

    let accountId = profile?.stripe_connect_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        individual: {
          first_name: profile?.first_name ?? "Demo",
          last_name: profile?.last_name ?? "Prof",
          email,
        },
        metadata: { gadz_user_id: user.id },
      });
      accountId = account.id;
      await admin
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);
      console.log("  Compte Stripe créé:", accountId);
    } else {
      console.log("  Compte Stripe:", accountId);
    }

    const account = await stripe.accounts.retrieve(accountId);
    const complete = Boolean(account.charges_enabled && account.payouts_enabled);
    console.log(
      "  État:",
      complete
        ? "✓ onboarding terminé"
        : `en cours (charges=${account.charges_enabled}, payouts=${account.payouts_enabled}, transfers=${account.capabilities?.transfers})`,
    );

    if (complete) {
      await admin
        .from("profiles")
        .update({ stripe_connect_onboarding_complete: true })
        .eq("id", user.id);
      continue;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: STRIPE_CONNECT_REFRESH_URL,
      return_url: STRIPE_CONNECT_RETURN_URL,
      type: "account_onboarding",
    });

    console.log("  Lien onboarding (ouvrir dans le navigateur):");
    console.log("  ", link.url);
  }

  console.log("\n── Après chaque onboarding ──");
  console.log("1. stripe listen doit tourner (webhook account.updated)");
  console.log("2. Retour sur http://localhost:5173/stripe/return");
  console.log("3. Vérifier /app/paiements → « Compte Stripe Connect actif »");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
