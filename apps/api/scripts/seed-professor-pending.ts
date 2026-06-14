/**
 * Crée un professeur en attente SIRET (parcours post-INPI à tester).
 * Usage: pnpm --filter @gadz-connect/api seed-professor-pending
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PROF_EMAIL = "prof.enattente@ensam.eu";

import { getDemoCampusId } from "./lib/demo-campus.js";
import { ensureDemoUserPassword } from "./lib/demo-auth.js";

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

  const auth = await ensureDemoUserPassword(admin, PROF_EMAIL);
  if (!auth.ok) {
    console.error("auth:", auth.message);
    process.exit(1);
  }
  const userId = auth.userId;
  console.log("Utilisateur auth prêt:", PROF_EMAIL);

  const profilePayload = {
    id: userId,
    first_name: "Paul",
    last_name: "Bernard",
    role: "teacher" as const,
    campus_id: campusId,
    siret: null,
    account_status: "pending_siret" as const,
    registration_path: "new_micro",
    micro_enterprise_activity: "enseignement" as const,
    urssaf_periodicity: "monthly" as const,
    versement_liberatoire: false,
    profile_setup_complete: true,
    cv: "Formation : Arts et Métiers Paris — génie mécanique.\nExpériences : 3 ans de tutorat en maths, physique et SolidWorks.\nCompétences : CAO, accompagnement de projets étudiants, pédagogie.",
  };

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);
    if (error) {
      console.error("update profile:", error.message);
      process.exit(1);
    }
    console.log("Profil professeur (pending) mis à jour");
  } else {
    const { error } = await admin.from("profiles").insert(profilePayload);
    if (error) {
      console.error("insert profile:", error.message);
      process.exit(1);
    }
    console.log("Profil professeur (pending) créé");
  }

  console.log("");
  console.log("── Prof en attente SIRET ──");
  console.log("E-mail   :", PROF_EMAIL);
  console.log("Mot de passe : Prof-EnAttente!");
  console.log("Statut   : pending_siret (onboarding fait, SIRET non déclaré)");
  console.log("");
  console.log("Test :");
  console.log("  1. Connexion dev → déclarer SIRET sur /app/micro-entreprise");
  console.log("  2. Compte activé automatiquement (sans validation RH)");
  console.log("");
  console.log("Autres seeds : pnpm --filter @gadz-connect/api seed-professor-personas");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
