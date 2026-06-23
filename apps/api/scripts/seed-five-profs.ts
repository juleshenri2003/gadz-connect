/**
 * Crée 5 professeurs démo hétérogènes, entièrement configurés pour QA marketplace.
 * Usage: pnpm --filter @gadz-connect/api seed-five-profs
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ensureStripeConnectAccount } from "../src/lib/stripe-connect-account.js";
import { stripe } from "../src/lib/stripe.js";
import { getDemoCampusId } from "./lib/demo-campus.js";
import { ensureDemoUserPassword } from "./lib/demo-auth.js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface ProfPersona {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  label: string;
  siret: string;
  address: string;
  hourlyRate: number;
  subjects: string[];
  bio: string;
  cv: string;
  registration_path: "existing_siret" | "new_micro";
  urssaf_periodicity: "monthly" | "quarterly";
  status_acre: boolean;
  versement_liberatoire: boolean;
  /** Décalage en jours pour le 1er créneau (14h-15h). */
  slotDayOffset: number;
  extraSlots: Array<{ dayOffset: number; hour: number; durationHours: number }>;
}

const PROFS: ProfPersona[] = [
  {
    email: "prof.cao@ensam.eu",
    password: "Prof-CAO!",
    firstName: "Claire",
    lastName: "Bernard",
    label: "CAO / SolidWorks — profil standard",
    siret: "40002512345678",
    address: "8 cours Mirabeau, 13100 Aix-en-Provence",
    hourlyRate: 45,
    subjects: ["SolidWorks", "CAO 3D", "Assemblages"],
    bio: "Ingénieure mécanique — 6 ans en bureau d'études, spécialiste SolidWorks et conception paramétrique.",
    cv: "Diplômée Arts et Métiers (2018). Expérience Dassault Systèmes et PME industrielle. Cours : modélisation 3D, plans, nomenclatures, préparation concours projet.",
    registration_path: "existing_siret",
    urssaf_periodicity: "monthly",
    status_acre: false,
    versement_liberatoire: false,
    slotDayOffset: 2,
    extraSlots: [
      { dayOffset: 4, hour: 10, durationHours: 2 },
      { dayOffset: 9, hour: 16, durationHours: 1 },
    ],
  },
  {
    email: "prof.maths@ensam.eu",
    password: "Prof-Maths!",
    firstName: "Thomas",
    lastName: "Leroy",
    label: "Maths / Physique — bénéficiaire ACRE",
    siret: "50003623456789",
    address: "22 rue d'Italie, 13100 Aix-en-Provence",
    hourlyRate: 38,
    subjects: ["Mathématiques", "Physique", "Prépa concours"],
    bio: "Normalien agrégé — accompagnement lycée et prépa scientifique, méthodologie et exercices type concours.",
    cv: "Agrégation de mathématiques. 3 ans en lycée, 2 ans de cours particuliers Gadz. Spécialités : analyse, algèbre linéaire, mécanique du point.",
    registration_path: "new_micro",
    urssaf_periodicity: "quarterly",
    status_acre: true,
    versement_liberatoire: false,
    slotDayOffset: 3,
    extraSlots: [
      { dayOffset: 5, hour: 18, durationHours: 1.5 },
      { dayOffset: 11, hour: 14, durationHours: 1 },
    ],
  },
  {
    email: "prof.dev@ensam.eu",
    password: "Prof-Dev!",
    firstName: "Léa",
    lastName: "Moreau",
    label: "Informatique / Python — versement libératoire",
    siret: "60004734567890",
    address: "5 place des Prêcheurs, 13100 Aix-en-Provence",
    hourlyRate: 52,
    subjects: ["Python", "Algorithmique", "Data"],
    bio: "Développeuse full-stack et enseignante — Python, structures de données, projets Git pour étudiants ingénieurs.",
    cv: "Master informatique CentraleSupélec. 4 ans en startup, open source. Cours : Python, POO, pandas, préparation examens programmation.",
    registration_path: "new_micro",
    urssaf_periodicity: "monthly",
    status_acre: false,
    versement_liberatoire: true,
    slotDayOffset: 1,
    extraSlots: [
      { dayOffset: 6, hour: 11, durationHours: 2 },
      { dayOffset: 8, hour: 17, durationHours: 1 },
    ],
  },
  {
    email: "prof.meca@ensam.eu",
    password: "Prof-Meca!",
    firstName: "Hugo",
    lastName: "Petit",
    label: "RDM / Fabrication — tarif intermédiaire",
    siret: "70005845678901",
    address: "14 rue Matheron, 13100 Aix-en-Provence",
    hourlyRate: 42,
    subjects: ["RDM", "Fabrication", "Usinage"],
    bio: "Technicien supérieur devenu tuteur — résistance des matériaux, procédés, lecture de plans atelier.",
    cv: "BTS conception de produits industriels + cycle ingénieur Arts et Métiers. Atelier universitaire. TP : flexion, traction, tolérances ISO.",
    registration_path: "existing_siret",
    urssaf_periodicity: "quarterly",
    status_acre: false,
    versement_liberatoire: false,
    slotDayOffset: 4,
    extraSlots: [
      { dayOffset: 7, hour: 15, durationHours: 1 },
      { dayOffset: 12, hour: 9, durationHours: 2 },
    ],
  },
  {
    email: "prof.design@ensam.eu",
    password: "Prof-Design!",
    firstName: "Nina",
    lastName: "Rousseau",
    label: "Design / Sketch — prof premium",
    siret: "80006956789012",
    address: "3 rue Gaston de Saporta, 13100 Aix-en-Provence",
    hourlyRate: 55,
    subjects: ["Design produit", "Sketch", "Prototypage"],
    bio: "Designer industrielle — croquis rapide, moodboards, storytelling produit pour projets de fin d'études.",
    cv: "DN MADE + double diplôme design industriel. Freelance pour startups. Portfolio : transport, mobilier, packaging. Coaching soutenance projet.",
    registration_path: "existing_siret",
    urssaf_periodicity: "monthly",
    status_acre: false,
    versement_liberatoire: false,
    slotDayOffset: 5,
    extraSlots: [
      { dayOffset: 10, hour: 13, durationHours: 1.5 },
      { dayOffset: 14, hour: 10, durationHours: 2 },
    ],
  },
];

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

async function tryCompleteStripeTestAccount(
  accountId: string,
): Promise<boolean> {
  if (!stripe) return false;

  try {
    await stripe.accounts.update(accountId, {
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: "127.0.0.1",
      },
      business_profile: {
        url: "https://gadzconnect.fr",
        product_description: "Cours particuliers et tutorat",
      },
    });
    const account = await stripe.accounts.retrieve(accountId);
    return Boolean(account.charges_enabled && account.payouts_enabled);
  } catch (err) {
    console.warn(
      "  Stripe onboarding test:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

async function seedSlots(
  adminClient: SupabaseClient,
  providerId: string,
  persona: ProfPersona,
): Promise<void> {
  await adminClient
    .from("tutor_slots")
    .delete()
    .eq("provider_id", providerId)
    .eq("booked", false);

  const slots = [
    slotRange(persona.slotDayOffset, 14, 1),
    ...persona.extraSlots.map((s) =>
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

  if (error) {
    throw new Error(`créneaux ${persona.email}: ${error.message}`);
  }
}

async function seedProf(
  campusId: string,
  persona: ProfPersona,
): Promise<void> {
  const auth = await ensureDemoUserPassword(
    admin,
    persona.email,
    persona.password,
  );
  if (!auth.ok) {
    throw new Error(`${persona.email}: ${auth.message}`);
  }

  const userId = auth.userId;

  let stripeConnectId: string | null = null;
  let stripeOnboardingComplete = false;

  if (stripe) {
    const connect = await ensureStripeConnectAccount({
      userId,
      email: persona.email,
      firstName: persona.firstName,
      lastName: persona.lastName,
    });
    stripeConnectId = connect.accountId;
    if (stripeConnectId) {
      stripeOnboardingComplete = await tryCompleteStripeTestAccount(
        stripeConnectId,
      );
    }
  }

  // Marketplace visible même si Stripe test n'a pas activé charges (UI + créneaux).
  if (!stripeOnboardingComplete && stripeConnectId) {
    stripeOnboardingComplete = true;
  }

  const profilePayload = {
    id: userId,
    first_name: persona.firstName,
    last_name: persona.lastName,
    role: "teacher" as const,
    campus_id: campusId,
    siret: persona.siret,
    is_autoentrepreneur_verified: true,
    siret_verification_failed: false,
    micro_enterprise_address: persona.address,
    account_status: "active" as const,
    registration_path: persona.registration_path,
    micro_enterprise_activity: "enseignement" as const,
    urssaf_periodicity: persona.urssaf_periodicity,
    status_acre: persona.status_acre,
    versement_liberatoire: persona.versement_liberatoire,
    profile_setup_complete: true,
    bio: persona.bio,
    cv: persona.cv,
    hourly_rate: persona.hourlyRate,
    subjects: persona.subjects,
    stripe_connect_account_id: stripeConnectId,
    stripe_connect_onboarding_complete: stripeOnboardingComplete,
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

  await seedSlots(admin, userId, persona);

  console.log(`✓ ${persona.email}`);
  console.log(`    ${persona.label}`);
  console.log(
    `    ${persona.hourlyRate} €/h · ${persona.subjects.join(", ")} · ${persona.extraSlots.length + 1} créneaux`,
  );
  console.log(`    Stripe: ${stripeConnectId ?? "non configuré"}`);
}

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) process.exit(1);

  console.log("── 5 professeurs démo (Aix) ──\n");

  for (const persona of PROFS) {
    await seedProf(campusId, persona);
    console.log("");
  }

  console.log("── Connexion ──");
  console.log("http://localhost:5173/");
  console.log("Mot de passe commun : voir ci-dessous\n");
  for (const p of PROFS) {
    console.log(`  ${p.email}  /  ${p.password}`);
  }
  console.log("\nÉlève test : eleve.dupont@ensam.eu / Eleve-Dupont!");
  console.log("Admin RH   : jules.henri@ensam.eu / Pilotage-RH!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
