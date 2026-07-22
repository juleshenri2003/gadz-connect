/**
 * Avance temporairement un cours scheduled dans le passé pour tester
 * la confirmation post-séance.
 *
 * Usage:
 *   pnpm --filter @gadz-connect/api exec tsx scripts/advance-course-for-confirmation.ts
 *   pnpm --filter @gadz-connect/api exec tsx scripts/advance-course-for-confirmation.ts -- --hours 3
 *   pnpm --filter @gadz-connect/api exec tsx scripts/advance-course-for-confirmation.ts -- --course-id <uuid>
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function argValue(flag: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.indexOf(flag);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

const HOURS = Number(argValue("--hours") ?? 3);
const COURSE_ID = argValue("--course-id");
const STUDENT_EMAIL = argValue("--email") ?? "eleve.dupont@ensam.eu";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function findUserId(email: string): Promise<string> {
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email);
    if (u) return u.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Utilisateur introuvable : ${email}`);
}

async function main() {
  if (!Number.isFinite(HOURS) || HOURS <= 0) {
    throw new Error(`--hours invalide : ${HOURS}`);
  }

  let target: {
    id: string;
    status: string;
    scheduled_at: string | null;
    slot_id: string | null;
    subject: string | null;
    title: string | null;
  } | null = null;

  if (COURSE_ID) {
    const { data, error } = await sb
      .from("courses")
      .select("id, status, scheduled_at, slot_id, subject, title")
      .eq("id", COURSE_ID)
      .maybeSingle();
    if (error) throw error;
    target = data;
  } else {
    const clientId = await findUserId(STUDENT_EMAIL);
    const { data: courses, error } = await sb
      .from("courses")
      .select("id, status, scheduled_at, slot_id, subject, title")
      .eq("client_id", clientId)
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    target = courses?.[0] ?? null;
  }

  if (!target) {
    console.log("Aucun cours trouvé à avancer.");
    return;
  }

  const start = new Date(Date.now() - HOURS * 3600 * 1000);
  const end = new Date(start.getTime() + 2 * 3600 * 1000);

  const { error: upCourse } = await sb
    .from("courses")
    .update({ scheduled_at: start.toISOString() })
    .eq("id", target.id);
  if (upCourse) throw upCourse;

  if (target.slot_id) {
    const { error: upSlot } = await sb
      .from("tutor_slots")
      .update({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
      })
      .eq("id", target.slot_id);
    if (upSlot) throw upSlot;
  }

  let status = "awaiting_session_confirmation";
  const { error: statusErr } = await sb
    .from("courses")
    .update({ status })
    .eq("id", target.id);

  if (statusErr) {
    console.warn(
      "awaiting_session_confirmation indisponible — fallback completed:",
      statusErr.message,
    );
    status = "completed";
    const { error: e2 } = await sb
      .from("courses")
      .update({ status })
      .eq("id", target.id);
    if (e2) throw e2;
  }

  const { data: after } = await sb
    .from("courses")
    .select("id, status, scheduled_at, slot_id, subject, title")
    .eq("id", target.id)
    .single();

  console.log(
    JSON.stringify(
      {
        hoursBack: HOURS,
        courseId: target.id,
        subject: after?.subject ?? after?.title,
        previousScheduledAt: target.scheduled_at,
        newScheduledAt: after?.scheduled_at,
        status: after?.status,
        note:
          after?.status === "completed"
            ? "Migration 030 absente : statut completed (la confirmation UI reste possible)."
            : "Prêt pour double confirmation post-séance.",
      },
      null,
      2,
    ),
  );
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
