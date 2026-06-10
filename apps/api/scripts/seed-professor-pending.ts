/**
 * Crée un professeur en attente SIRET (parcours post-INPI à tester).
 * Usage: pnpm --filter @gadz-connect/api seed-professor-pending
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PROF_EMAIL = "prof.enattente@ensam.eu";

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
    (u) => u.email?.toLowerCase() === PROF_EMAIL,
  )?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: PROF_EMAIL,
      email_confirm: true,
      user_metadata: { first_name: "Paul", last_name: "Bernard" },
    });
    if (error || !created.user) {
      console.error("createUser:", error?.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log("Utilisateur auth créé:", PROF_EMAIL);
  } else {
    console.log("Utilisateur auth existant:", PROF_EMAIL);
  }

  const profilePayload = {
    id: userId,
    first_name: "Paul",
    last_name: "Bernard",
    role: "teacher" as const,
    campus_id: campus.id,
    siret: null,
    account_status: "pending_siret" as const,
    micro_enterprise_activity: "enseignement" as const,
    urssaf_periodicity: "monthly" as const,
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
  console.log("Statut   : pending_siret (onboarding fait, SIRET non déclaré)");
  console.log("");
  console.log("Test :");
  console.log("  1. Connexion dev → déclarer SIRET sur /app/micro-entreprise");
  console.log("  2. RH jules.henri@ensam.eu → /admin/membres → Valider SIRET");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
