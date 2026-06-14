/**
 * Remet un professeur à zéro pour tester l'onboarding complet depuis le début.
 * Usage: pnpm --filter @gadz-connect/api seed-professor-fresh
 *        PROF_EMAIL=prof.fresh@ensam.eu pnpm --filter @gadz-connect/api seed-professor-fresh
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getDemoCampusId } from "./lib/demo-campus.js";
import { ensureDemoUserPassword } from "./lib/demo-auth.js";
import { getDemoAccount } from "../src/lib/demo-accounts.js";

const PROF_EMAIL = process.env.PROF_EMAIL ?? "prof.enattente@ensam.eu";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) {
    process.exit(1);
  }

  const password =
    getDemoAccount(PROF_EMAIL)?.password ?? "Prof-Demo!";

  const auth = await ensureDemoUserPassword(admin, PROF_EMAIL, password);
  if (!auth.ok) {
    console.error("auth:", auth.message);
    process.exit(1);
  }
  const userId = auth.userId;

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      first_name: "Léa",
      last_name: "Moreau",
      inpi_declaration_sent_at: null,
    },
  });
  console.log("Utilisateur auth prêt:", PROF_EMAIL);

  await admin.from("tutor_slots").delete().eq("provider_id", userId);

  const freshProfile = {
    id: userId,
    first_name: "Léa",
    last_name: "Moreau",
    role: "teacher" as const,
    campus_id: campusId,
    siret: null,
    account_status: "pending_siret" as const,
    micro_enterprise_activity: null,
    urssaf_periodicity: null,
    versement_liberatoire: false,
    profile_setup_complete: false,
    inpi_declaration_sent_at: null,
    bio: null,
    cv: null,
    cv_pdf_path: null,
    hourly_rate: null,
    subjects: [] as string[],
    stripe_connect_account_id: null,
    stripe_connect_onboarding_complete: false,
  };

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await admin
      .from("profiles")
      .update(freshProfile)
      .eq("id", userId);
    if (error) {
      console.error("update profile:", error.message);
      process.exit(1);
    }
    console.log("Profil réinitialisé (onboarding vierge)");
  } else {
    const { error } = await admin.from("profiles").insert(freshProfile);
    if (error) {
      console.error("insert profile:", error.message);
      process.exit(1);
    }
    console.log("Profil créé (onboarding vierge)");
  }

  console.log("");
  console.log("── Prof onboarding vierge ──");
  console.log("E-mail  :", PROF_EMAIL);
  console.log("Mot de passe :", password);
  console.log("Statut  : pending_siret, aucune étape complétée");
  console.log("");
  console.log("Parcours à tester :");
  console.log("  1. Connexion → /app/setup (profil)");
  console.log("  2. /app/micro-entreprise → questionnaire fiscal");
  console.log("  3. Guide INPI (sur le site INPI) + bouton « J'ai envoyé ma demande »");
  console.log("  4. Déclarer le SIRET reçu de l'INSEE");
  console.log("  5. Validation RH → /admin/membres");
  console.log("  6. Stripe + publier des créneaux");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
