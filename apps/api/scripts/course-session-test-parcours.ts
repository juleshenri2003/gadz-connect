/**
 * Prépare un parcours de test complet pour confirmations 24 h, remplacement et remboursements.
 *
 * Usage:
 *   pnpm --filter @gadz-connect/api course-session-test-parcours
 *   pnpm --filter @gadz-connect/api course-session-test-parcours -- --run-jobs
 *
 * Prérequis: migration 026, API + web locaux, seeds démo (prof.martin, prof.maths, eleve.dupont).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../src/lib/demo-accounts.js";
import { computeReplacementExpiresAt } from "../src/lib/course-session-config.js";
import { runCourseSessionJobs } from "../src/lib/course-session-jobs.js";

const PREFIX = "[TEST-PARCOURS]";
const RUN_JOBS = process.argv.includes("--run-jobs");
const APP_URL = process.env.GADZ_APP_URL ?? "http://localhost:5173";

const EMAILS = {
  student: "eleve.dupont@ensam.eu",
  profA: "prof.martin@ensam.eu",
  profB: "prof.maths@ensam.eu",
  admin: "jules.henri@ensam.eu",
} as const;

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

function daysFromNow(d: number): string {
  return hoursFromNow(d * 24);
}

async function profileId(email: string): Promise<string> {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Utilisateur introuvable : ${email}`);
}

async function cleanupOldParcours(): Promise<void> {
  const { data: courses } = await admin
    .from("courses")
    .select("id")
    .like("title", `${PREFIX}%`);

  const ids = (courses ?? []).map((c) => c.id as string);
  if (ids.length === 0) return;

  await admin.from("replacement_proposals").delete().in("original_course_id", ids);
  await admin.from("campus_notifications").delete().in("course_id", ids);
  await admin.from("transactions").delete().in("course_id", ids);
  await admin.from("courses").delete().in("id", ids);
}

async function insertPaidCourse(input: {
  label: string;
  subject: string;
  scheduledAt: string;
  status: string;
  campusId: string;
  providerId: string;
  clientId: string;
  studentConfirmedAt?: string | null;
  providerConfirmedAt?: string | null;
  confirmationReminderSentAt?: string | null;
  confirmationEscalatedAt?: string | null;
  replacementExpiresAt?: string | null;
}): Promise<string> {
  const id = randomUUID();
  const { error: courseError } = await admin.from("courses").insert({
    id,
    title: `${PREFIX} ${input.label}`,
    subject: input.subject,
    campus_id: input.campusId,
    provider_id: input.providerId,
    client_id: input.clientId,
    scheduled_at: input.scheduledAt,
    status: input.status,
    student_confirmed_at: input.studentConfirmedAt ?? null,
    provider_confirmed_at: input.providerConfirmedAt ?? null,
    confirmation_reminder_sent_at: input.confirmationReminderSentAt ?? null,
    confirmation_escalated_at: input.confirmationEscalatedAt ?? null,
    replacement_expires_at: input.replacementExpiresAt ?? null,
  });

  if (courseError) throw courseError;

  const gross = 45;
  const commission = 3;
  const taxes = 8.87;
  const net = gross - commission - taxes;

  await admin.from("transactions").insert({
    course_id: id,
    amount_gross: gross,
    commission_sasu: commission,
    taxes_urssaf: taxes,
    net_payout: net,
    total_paid_parent: gross,
    platform_commission: commission,
    teacher_gross_revenue: gross - commission,
    status_stripe: "succeeded",
    status_urssaf: "pending",
  });

  return id;
}

async function setupAwaitingReplacementRefund(
  courseId: string,
  campusId: string,
  providerId: string,
  clientId: string,
  scheduledAt: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await admin
    .from("courses")
    .update({
      status: "awaiting_replacement",
      replacement_expires_at: expiresAt,
    })
    .eq("id", courseId);

  const notifId = randomUUID();
  await admin.from("campus_notifications").insert({
    id: notifId,
    campus_id: campusId,
    course_id: courseId,
    kind: "prof_unavailable",
    title: `${PREFIX} Annulation prof (test remboursement)`,
    message: "Scénario E — remplacement expiré, remboursement auto attendu.",
    scheduled_at: scheduledAt,
    declared_by: providerId,
    replacement_status: "open",
    original_provider_id: providerId,
    client_id: clientId,
    subject: "Mathématiques (test)",
    replacement_course_id: courseId,
  });
}

function printCredentials(): void {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  COMPTES DE TEST");
  console.log("═══════════════════════════════════════════════════════════\n");
  for (const [role, email] of Object.entries(EMAILS)) {
    const pwd = DEMO_ACCOUNTS[email]?.password ?? "?";
    console.log(`  ${role.padEnd(8)} ${email}`);
    console.log(`           Mot de passe : ${pwd}\n`);
  }
  console.log(`  App web : ${APP_URL}\n`);
}

function printParcours(scenarios: Record<string, string>): void {
  const { A, B, C, D, E } = scenarios;

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  PARCOURS COMPLET — CONFIRMATIONS & REMPLACEMENT");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("── ÉTAPE 0 — Prérequis ─────────────────────────────────────");
  console.log("  • Migration 026 appliquée");
  console.log("  • API (port 3001) + web (5173) démarrés");
  console.log(`  • 5 cours de test créés (préfixe ${PREFIX})\n`);

  console.log("── ÉTAPE 1 — Confirmation bilatérale (manuel, ~5 min) ─────");
  console.log(`  Cours A : ${A}`);
  console.log("  Séance dans 5 jours — aucune confirmation encore.\n");
  console.log("  1. Connecte-toi ÉLÈVE → Planning → cours « Confirmation manuelle »");
  console.log("     → « Je confirme ma présence » → pastille Élève ✓");
  console.log("  2. Connecte-toi PROF MARTIN → Planning → même cours");
  console.log("     → « Je confirme ma présence » → pastille Prof ✓");
  console.log("  3. (Option) Élève → « Relancer l'autre partie » avant que le prof confirme");
  console.log("  4. Vérif Alertes : alerte « Confirmation séance » avec bouton confirmer\n");

  console.log("── ÉTAPE 2 — Rappel automatique J-24 h ───────────────────");
  console.log(`  Cours B : ${B}`);
  console.log("  Séance dans ~24 h — prêt pour le cron.\n");
  if (RUN_JOBS) {
    console.log("  ✓ --run-jobs : cron déjà lancé (voir compteur « Rappels 24 h » ci-dessus)");
  } else {
    console.log("  Lance : pnpm --filter @gadz-connect/api course-session-jobs");
  }
  console.log("  Puis ÉLÈVE + PROF MARTIN → Alertes → « Confirmez votre présence »\n");

  console.log("── ÉTAPE 3 — Escalade admin J-2 h (confirmations incomplètes) ─");
  console.log(`  Cours C : ${C}`);
  console.log("  Séance dans ~90 min — personne n'a confirmé.\n");
  if (RUN_JOBS) {
    console.log("  ✓ --run-jobs : cron déjà lancé (voir « Escalades admin »)");
  } else {
    console.log("  Lance : pnpm --filter @gadz-connect/api course-session-jobs");
  }
  console.log("  Attendu :");
  console.log("    • ÉLÈVE → alerte « Confirmation incomplète »");
  console.log("    • ADMIN RH → même alerte (intervention, PAS de remboursement auto)\n");

  console.log("── ÉTAPE 4 — Annulation prof → remplacement campus (~10 min) ─");
  console.log(`  Cours D : ${D}`);
  console.log("  Séance dans ~6 h — cours normal scheduled.\n");
  console.log("  1. PROF MARTIN → Planning → « Mathématiques (remplacement) »");
  console.log("     → « Je ne peux pas assurer ce cours » (+ motif optionnel)");
  console.log("  2. Attendu : statut « Remplacement en cours », créneau toujours réservé");
  console.log("  3. PROF MATHS → Alertes → « Cours à reprendre »");
  console.log("     → « Je peux assurer ce cours »");
  console.log("  4. ÉLÈVE → Alertes → « Remplaçant proposé » → Accepter");
  console.log("  5. Attendu : cours repasse planifié, prof = Thomas Leroy (maths)");
  console.log("  6. (Option) Refuser un candidat → un autre prof peut encore se proposer\n");

  console.log("── ÉTAPE 5 — Remboursement auto (aucun remplaçant) ─────────");
  console.log(`  Cours E : ${E}`);
  console.log("  Déjà en awaiting_replacement, deadline expirée.\n");
  if (RUN_JOBS) {
    console.log("  ✓ --run-jobs : cron déjà lancé (voir « Remboursements auto »)");
  } else {
    console.log("  Lance : pnpm --filter @gadz-connect/api course-session-jobs");
  }
  console.log("  Attendu :");
  console.log("    • Cours → cancelled");
  console.log("    • Transaction → refunded");
  console.log("    • ÉLÈVE + ADMIN → alerte « Remboursement »");
  console.log("    • (Stripe test) remboursement visible dans le dashboard Stripe\n");

  console.log("── VÉRIFICATIONS SQL (Supabase) ────────────────────────────\n");
  console.log(`  SELECT id, title, status, scheduled_at,`);
  console.log(`         student_confirmed_at, provider_confirmed_at,`);
  console.log(`         replacement_expires_at`);
  console.log(`  FROM courses WHERE title LIKE '${PREFIX}%';`);
  console.log("");
  console.log(`  SELECT course_id, status_stripe FROM transactions`);
  console.log(`  WHERE course_id IN (SELECT id FROM courses WHERE title LIKE '${PREFIX}%');\n`);

  console.log("── NETTOYAGE ───────────────────────────────────────────────");
  console.log("  Relance ce script pour recréer un parcours propre,");
  console.log(`  ou DELETE FROM courses WHERE title LIKE '${PREFIX}%';`);
  console.log("\n═══════════════════════════════════════════════════════════\n");
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
    process.exit(1);
  }

  console.log(`\n── Préparation parcours ${PREFIX} ──\n`);

  const [studentId, profAId] = await Promise.all([
    profileId(EMAILS.student),
    profileId(EMAILS.profA),
  ]);
  await profileId(EMAILS.profB).catch(() => null);

  const { data: profProfile } = await admin
    .from("profiles")
    .select("campus_id")
    .eq("id", profAId)
    .single();

  if (!profProfile?.campus_id) {
    throw new Error("Campus prof.martin introuvable");
  }

  const campusId = profProfile.campus_id as string;

  await cleanupOldParcours();

  const courseA = await insertPaidCourse({
    label: "A — Confirmation manuelle",
    subject: "SolidWorks (test confirmation)",
    scheduledAt: daysFromNow(5),
    status: "scheduled",
    campusId,
    providerId: profAId,
    clientId: studentId,
  });

  const courseB = await insertPaidCourse({
    label: "B — Rappel 24 h",
    subject: "Physique (test rappel)",
    scheduledAt: hoursFromNow(24),
    status: "scheduled",
    campusId,
    providerId: profAId,
    clientId: studentId,
    confirmationReminderSentAt: null,
  });

  const courseC = await insertPaidCourse({
    label: "C — Escalade J-2 h",
    subject: "Mécanique (test escalade)",
    scheduledAt: hoursFromNow(1.5),
    status: "scheduled",
    campusId,
    providerId: profAId,
    clientId: studentId,
    confirmationEscalatedAt: null,
  });

  const scheduledD = hoursFromNow(6);
  const courseD = await insertPaidCourse({
    label: "D — Remplacement campus",
    subject: "Mathématiques (remplacement)",
    scheduledAt: scheduledD,
    status: "scheduled",
    campusId,
    providerId: profAId,
    clientId: studentId,
  });

  const scheduledE = hoursFromNow(4);
  const courseE = await insertPaidCourse({
    label: "E — Remboursement auto",
    subject: "Mathématiques (test remboursement)",
    scheduledAt: scheduledE,
    status: "scheduled",
    campusId,
    providerId: profAId,
    clientId: studentId,
    replacementExpiresAt: computeReplacementExpiresAt(scheduledE),
  });

  await setupAwaitingReplacementRefund(
    courseE,
    campusId,
    profAId,
    studentId,
    scheduledE,
  );

  console.log("Cours créés :");
  console.log(`  A (confirmation)  ${courseA}`);
  console.log(`  B (rappel 24 h)   ${courseB}`);
  console.log(`  C (escalade)      ${courseC}`);
  console.log(`  D (remplacement)  ${courseD}`);
  console.log(`  E (remboursement) ${courseE}`);

  if (RUN_JOBS) {
    console.log("\n── Exécution course-session-jobs ──");
    const stats = await runCourseSessionJobs();
    console.log(`  Rappels 24 h     : ${stats.remindersSent}`);
    console.log(`  Escalades admin  : ${stats.escalationsSent}`);
    console.log(`  Remboursements   : ${stats.replacementsRefunded}`);
    if (stats.errors.length) {
      for (const err of stats.errors) console.error(`  ! ${err}`);
    }
  }

  printCredentials();
  printParcours({
    A: courseA,
    B: courseB,
    C: courseC,
    D: courseD,
    E: courseE,
  });

  console.log(
    "Astuce : relance avec --run-jobs pour enchaîner cron + parcours en une commande.\n",
  );
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
