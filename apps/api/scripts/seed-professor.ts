/**
 * Crée un professeur fictif pour tester l'onboarding / SIRET.
 * Usage: pnpm --filter @gadz-connect/api seed-professor
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PROF_EMAIL = "prof.martin@ensam.eu";
const FAKE_SIRET = "12345678901234";

import { getDemoCampusId } from "./lib/demo-campus.js";

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

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let userId = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === PROF_EMAIL,
  )?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: PROF_EMAIL,
      email_confirm: true,
      user_metadata: { first_name: "Marie", last_name: "Martin" },
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

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  const profilePayload = {
    id: userId,
    first_name: "Marie",
    last_name: "Martin",
    role: "teacher" as const,
    campus_id: campusId,
    siret: FAKE_SIRET,
    account_status: "active" as const,
    micro_enterprise_activity: "enseignement" as const,
    urssaf_periodicity: "monthly" as const,
    versement_liberatoire: false,
    profile_setup_complete: true,
    bio: "Professeure SolidWorks et conception mécanique — 8 ans d'expérience.",
    cv: "Formation : Arts et Métiers — diplôme d'ingénieur mécanique.\nExpériences : 8 ans en industrie, 4 ans de tutorat.\nCompétences : SolidWorks, CAO, RDM, accompagnement projets.",
    hourly_rate: 45,
    subjects: ["SolidWorks", "CAO", "Résistance des matériaux"],
  };

  if (existingProfile) {
    const { error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);
    if (error) {
      console.error("update profile:", error.message);
      process.exit(1);
    }
    console.log("Profil professeur mis à jour");
  } else {
    const { error } = await admin.from("profiles").insert(profilePayload);
    if (error) {
      console.error("insert profile:", error.message);
      process.exit(1);
    }
    console.log("Profil professeur créé");
  }

  console.log("");
  console.log("── Prof fictif prêt ──");
  console.log("E-mail   :", PROF_EMAIL);
  console.log("SIRET    :", FAKE_SIRET, "(inventé — test uniquement)");
  console.log("Rôle     : teacher");
  console.log("Statut   : active");
  console.log("");
  const slotStart = new Date();
  slotStart.setDate(slotStart.getDate() + 2);
  slotStart.setHours(14, 0, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(15, 0, 0, 0);

  await admin.from("tutor_slots").delete().eq("provider_id", userId);
  await admin.from("tutor_slots").insert({
    provider_id: userId,
    starts_at: slotStart.toISOString(),
    ends_at: slotEnd.toISOString(),
  });

  console.log("Connexion dev : http://localhost:5173/auth/login");
  console.log("  → saisir", PROF_EMAIL, "→ « Connexion directe (dev) »");
  console.log("Marketplace : créneau tuteur ajouté (J+2 14h-15h)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
