/**
 * Crée un élève fictif (client tutorat — sans SIRET ni micro-entreprise).
 * Usage: pnpm --filter @gadz-connect/api seed-student
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const STUDENT_EMAIL = "eleve.dupont@ensam.eu";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: campus } = await admin
    .from("campus")
    .select("id")
    .eq("name", "Paris")
    .maybeSingle();

  if (!campus) {
    console.error("Campus Paris introuvable");
    process.exit(1);
  }

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let userId = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === STUDENT_EMAIL,
  )?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: STUDENT_EMAIL,
      email_confirm: true,
      user_metadata: { first_name: "Thomas", last_name: "Dupont" },
    });
    if (error || !created.user) {
      console.error("createUser:", error?.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log("Utilisateur auth créé:", STUDENT_EMAIL);
  } else {
    console.log("Utilisateur auth existant:", STUDENT_EMAIL);
  }

  const profilePayload = {
    id: userId,
    first_name: "Thomas",
    last_name: "Dupont",
    role: "student_provider" as const,
    campus_id: campus.id,
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
  console.log("Campus   : Paris");
  console.log("Rôle     : Élève (sans SIRET)");
  console.log("Statut   : active");
  console.log("");
  console.log("Connexion dev : http://localhost:5173/auth/login");
  console.log("  → saisir", STUDENT_EMAIL, "→ « Connexion directe (dev) »");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
