/**
 * Seeds de test pour les parcours prestataire (express, complet, suspendu).
 * Usage: pnpm --filter @gadz-connect/api seed-professor-personas
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getDemoCampusId } from "./lib/demo-campus.js";
import { ensureDemoUserPassword } from "./lib/demo-auth.js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const PERSONAS = [
  {
    email: "prof.express@ensam.eu",
    firstName: "Emma",
    lastName: "Express",
    registration_path: "existing_siret",
    account_status: "pending_siret",
    siret: null as string | null,
    micro_enterprise_activity: null as string | null,
    label: "Parcours express — questionnaire incomplet",
  },
  {
    email: "prof.complet@ensam.eu",
    firstName: "Luc",
    lastName: "Complet",
    registration_path: "new_micro",
    account_status: "pending_siret",
    siret: null,
    micro_enterprise_activity: "enseignement",
    label: "Parcours complet — post-INPI, SIRET à déclarer",
  },
  {
    email: "prof.suspended@ensam.eu",
    firstName: "Sam",
    lastName: "Suspendu",
    registration_path: "existing_siret",
    account_status: "suspended",
    siret: "73282932000074",
    micro_enterprise_activity: "enseignement",
    label: "Compte suspendu",
  },
] as const;

async function ensureUser(email: string, firstName: string, lastName: string) {
  const auth = await ensureDemoUserPassword(admin, email);
  if (!auth.ok) throw new Error(auth.message);
  return auth.userId;
}

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) process.exit(1);

  for (const p of PERSONAS) {
    const userId = await ensureUser(p.email, p.firstName, p.lastName);
    const payload = {
      id: userId,
      first_name: p.firstName,
      last_name: p.lastName,
      role: "teacher" as const,
      campus_id: campusId,
      siret: p.siret,
      account_status: p.account_status,
      registration_path: p.registration_path,
      micro_enterprise_activity: p.micro_enterprise_activity,
      urssaf_periodicity: "quarterly" as const,
      versement_liberatoire: false,
      profile_setup_complete: true,
      cv: "Profil seed — tutorat Arts et Métiers, expérience pédagogique et accompagnement projet.",
    };

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      await admin.from("profiles").update(payload).eq("id", userId);
    } else {
      await admin.from("profiles").insert(payload);
    }

    console.log(`✓ ${p.email} — ${p.label}`);
  }

  console.log("\nComptes seed prêts pour QA manuelle.");
  console.log("Mots de passe : pnpm --filter @gadz-connect/api seed-demo-passwords");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
