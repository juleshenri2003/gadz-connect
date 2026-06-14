/**
 * Crée un élève fictif (client tutorat — sans SIRET ni micro-entreprise).
 * Usage: pnpm --filter @gadz-connect/api seed-student
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const STUDENT_EMAIL = "eleve.dupont@ensam.eu";

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

  const auth = await ensureDemoUserPassword(admin, STUDENT_EMAIL);
  if (!auth.ok) {
    console.error("auth:", auth.message);
    process.exit(1);
  }
  const userId = auth.userId;
  console.log("Utilisateur auth prêt:", STUDENT_EMAIL);

  const profilePayload = {
    id: userId,
    first_name: "Thomas",
    last_name: "Dupont",
    role: "student_provider" as const,
    campus_id: campusId,
    siret: null,
    account_status: "active" as const,
    micro_enterprise_activity: null,
    urssaf_periodicity: null,
    versement_liberatoire: false,
    profile_setup_complete: true,
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
    console.log("Profil élève mis à jour");
  } else {
    const { error } = await admin.from("profiles").insert(profilePayload);
    if (error) {
      console.error("insert profile:", error.message);
      process.exit(1);
    }
    console.log("Profil élève créé");
  }

  console.log("");
  console.log("── Élève fictif prêt ──");
  console.log("E-mail   :", STUDENT_EMAIL);
  console.log("Mot de passe : Eleve-Dupont!");
  console.log("Campus   : Paris");
  console.log("Rôle     : Élève (sans SIRET)");
  console.log("Statut   : active");
  console.log("");
  console.log("Connexion : http://localhost:5173/login");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
