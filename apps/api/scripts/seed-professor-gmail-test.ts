/**
 * Prof complet pour test facture auto (e-mail Gmail réel).
 * Usage: pnpm --filter @gadz-connect/api seed-professor-gmail-test
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ensureStripeConnectAccount } from "../src/lib/stripe-connect-account.js";
import {
  completeStripeTestConnectAccount,
  isStripeTestMode,
} from "../src/lib/stripe-test-connect.js";
import { stripe } from "../src/lib/stripe.js";
import { getDemoCampusId } from "./lib/demo-campus.js";

const PROF_EMAIL = "alexandreandre2004@gmail.com";
const PROF_PASSWORD = "Prof-Alexandre!";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const PERSONA = {
  email: PROF_EMAIL,
  password: PROF_PASSWORD,
  firstName: "Alexandre",
  lastName: "Andre",
  siret: "80006956789012",
  address: "12 avenue Victor Hugo, 13100 Aix-en-Provence",
  hourlyRate: 48,
  subjects: ["Mécanique", "RDM", "Méthodologie"],
  bio: "Étudiant Arts et Métiers — tutorat mécanique et méthodologie projet, campus Aix.",
  cv: "Parcours Ensam Aix. Accompagnement élèves en RDM, mécanique des fluides et préparation partiels. Plus de 2 ans de cours particuliers entre Gadz'.",
  registration_path: "existing_siret" as const,
  urssaf_periodicity: "monthly" as const,
  status_acre: true,
  versement_liberatoire: false,
  slotDayOffset: 2,
  extraSlots: [
    { dayOffset: 4, hour: 10, durationHours: 1.5 },
    { dayOffset: 7, hour: 16, durationHours: 1 },
  ],
};

function slotRange(
  dayOffset: number,
  hour: number,
  durationHours: number,
): { starts_at: string; ends_at: string } {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setTime(end.getTime() + durationHours * 60 * 60 * 1000);
  return { starts_at: start.toISOString(), ends_at: end.toISOString() };
}

async function ensureAuthUser(
  email: string,
  password: string,
): Promise<string> {
  const { data: listed, error: listError } =
    await admin.auth.admin.listUsers({ perPage: 500 });
  if (listError) throw new Error(listError.message);

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return existing.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) {
    throw new Error(error?.message ?? "Impossible de créer le compte auth");
  }
  return created.user.id;
}

async function seedSlots(
  adminClient: SupabaseClient,
  providerId: string,
): Promise<void> {
  await adminClient
    .from("tutor_slots")
    .delete()
    .eq("provider_id", providerId)
    .eq("booked", false);

  const slots = [
    slotRange(PERSONA.slotDayOffset, 14, 1),
    ...PERSONA.extraSlots.map((s) =>
      slotRange(s.dayOffset, s.hour, s.durationHours),
    ),
  ];

  const { error } = await adminClient.from("tutor_slots").insert(
    slots.map((s) => ({
      provider_id: providerId,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      booked: false,
    })),
  );

  if (error) throw new Error(`créneaux: ${error.message}`);
}

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) process.exit(1);

  console.log("── Prof test facture (Gmail) ──\n");

  const userId = await ensureAuthUser(PERSONA.email, PERSONA.password);

  let stripeConnectId: string | null = null;
  let stripeOnboardingComplete = false;

  if (stripe) {
    const connect = await ensureStripeConnectAccount({
      userId,
      email: PERSONA.email,
      firstName: PERSONA.firstName,
      lastName: PERSONA.lastName,
      testPrefill: true,
    });
    stripeConnectId = connect.accountId;
    if (stripeConnectId) {
      try {
        const status = await completeStripeTestConnectAccount(stripeConnectId, {
          email: PERSONA.email,
          firstName: PERSONA.firstName,
          lastName: PERSONA.lastName,
        });
        stripeOnboardingComplete = status.onboardingComplete;
      } catch (err) {
        console.warn(
          "  Stripe onboarding test:",
          err instanceof Error ? err.message : err,
        );
      }
      if (isStripeTestMode() && stripeConnectId && !stripeOnboardingComplete) {
        stripeOnboardingComplete = true;
      }
    }
  }

  const profilePayload = {
    id: userId,
    first_name: PERSONA.firstName,
    last_name: PERSONA.lastName,
    role: "teacher" as const,
    campus_id: campusId,
    siret: PERSONA.siret,
    is_autoentrepreneur_verified: true,
    siret_verification_failed: false,
    micro_enterprise_address: PERSONA.address,
    account_status: "active" as const,
    registration_path: PERSONA.registration_path,
    micro_enterprise_activity: "enseignement" as const,
    urssaf_periodicity: PERSONA.urssaf_periodicity,
    status_acre: PERSONA.status_acre,
    versement_liberatoire: PERSONA.versement_liberatoire,
    profile_setup_complete: true,
    bio: PERSONA.bio,
    cv: PERSONA.cv,
    hourly_rate: PERSONA.hourlyRate,
    subjects: PERSONA.subjects,
    stripe_connect_account_id: stripeConnectId,
    stripe_connect_onboarding_complete: stripeOnboardingComplete,
    inpi_declaration_sent_at: null,
  };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("profiles").insert(profilePayload);
    if (error) throw new Error(error.message);
  }

  await seedSlots(admin, userId);

  console.log(`✓ ${PERSONA.email}`);
  console.log(`  ${PERSONA.firstName} ${PERSONA.lastName} — prof actif Aix`);
  console.log(
    `  ${PERSONA.hourlyRate} €/h · ${PERSONA.subjects.join(", ")} · 3 créneaux`,
  );
  console.log(`  SIRET: ${PERSONA.siret}`);
  console.log(`  Stripe: ${stripeConnectId ?? "non configuré"}`);
  console.log("\n── Connexion ──");
  console.log(`  E-mail       : ${PERSONA.email}`);
  console.log(`  Mot de passe : ${PERSONA.password}`);
  console.log("  http://localhost:5173/login");
  console.log("\n── Test facture auto ──");
  console.log("  1. Connecte eleve.dupont@ → réserve un créneau d'Alexandre");
  console.log("  2. Paie (CB test Stripe)");
  console.log(`  3. Vérifie ${PERSONA.email} (facture prof HT)`);
  console.log("  4. Admin → Budgets → Centre facturation → Professeurs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
