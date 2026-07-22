import {
  confirmationReminderWindow,
  isPastConfirmationEscalation,
  isPastReplacementDeadline,
  isPastSessionConfirmationDispute,
  shouldSendPostSessionReminder,
} from "./course-session-config.js";
import {
  notifyCourseConfirmationEscalation,
  notifyCourseConfirmationReminder,
} from "./course-session-notify.js";
import {
  notifySessionConfirmReminder,
  notifySessionDispute,
} from "./notification-helpers.js";
import { markPastCoursesCompleted } from "./course-completion.js";
import { refundCoursePayment } from "./stripe-refund.js";
import { supabaseAdmin } from "./supabase.js";

export interface CourseSessionJobStats {
  remindersSent: number;
  escalationsSent: number;
  replacementsRefunded: number;
  postSessionRemindersSent: number;
  sessionDisputesOpened: number;
  /** Infos non bloquantes (ex. migration 030 absente). */
  warnings: string[];
  errors: string[];
}

/** Schéma post-séance (migration 030) pas encore appliqué. */
function isPostSessionSchemaMissing(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("student_session_confirmed_at") ||
    lower.includes("provider_session_confirmed_at") ||
    lower.includes("session_confirm_reminder") ||
    lower.includes("session_dispute_status") ||
    lower.includes("awaiting_session_confirmation") ||
    (lower.includes("column") && lower.includes("does not exist")) ||
    lower.includes("invalid input value for enum")
  );
}

type CourseRow = {
  id: string;
  campus_id: string;
  scheduled_at: string;
  subject: string | null;
  title: string;
  client_id: string | null;
  provider_id: string | null;
  student_confirmed_at: string | null;
  provider_confirmed_at: string | null;
  confirmation_reminder_sent_at: string | null;
  confirmation_escalated_at: string | null;
  replacement_expires_at: string | null;
  student_session_confirmed_at?: string | null;
  provider_session_confirmed_at?: string | null;
  session_confirm_reminder_count?: number | null;
  session_dispute_status?: string | null;
  status: string;
};

export async function runCourseSessionJobs(
  now = new Date(),
): Promise<CourseSessionJobStats> {
  const stats: CourseSessionJobStats = {
    remindersSent: 0,
    escalationsSent: 0,
    replacementsRefunded: 0,
    postSessionRemindersSent: 0,
    sessionDisputesOpened: 0,
    warnings: [],
    errors: [],
  };

  try {
    await markPastCoursesCompleted();
  } catch (err) {
    stats.errors.push(
      `markPast: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  await processConfirmationReminders(stats, now);
  await processConfirmationEscalations(stats, now);
  await processExpiredReplacements(stats, now);
  await processPostSessionReminders(stats, now);
  await processSessionConfirmationDisputes(stats, now);

  return stats;
}

async function processConfirmationReminders(
  stats: CourseSessionJobStats,
  now: Date,
): Promise<void> {
  const window = confirmationReminderWindow(now);

  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, scheduled_at, subject, title, client_id, provider_id, confirmation_reminder_sent_at, status",
    )
    .eq("status", "scheduled")
    .is("confirmation_reminder_sent_at", null)
    .gte("scheduled_at", window.from)
    .lte("scheduled_at", window.to);

  if (error) {
    stats.errors.push(`reminders: ${error.message}`);
    return;
  }

  for (const row of data ?? []) {
    try {
      await notifyCourseConfirmationReminder(row as CourseRow);
      await supabaseAdmin
        .from("courses")
        .update({ confirmation_reminder_sent_at: now.toISOString() })
        .eq("id", row.id);
      stats.remindersSent += 1;
    } catch (err) {
      stats.errors.push(
        `reminder ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

async function processConfirmationEscalations(
  stats: CourseSessionJobStats,
  now: Date,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, scheduled_at, subject, title, client_id, provider_id, student_confirmed_at, provider_confirmed_at, confirmation_escalated_at, status",
    )
    .eq("status", "scheduled")
    .is("confirmation_escalated_at", null)
    .not("scheduled_at", "is", null);

  if (error) {
    stats.errors.push(`escalations: ${error.message}`);
    return;
  }

  for (const row of data ?? []) {
    const course = row as CourseRow;
    if (!isPastConfirmationEscalation(course.scheduled_at, now)) continue;

    const studentOk = Boolean(course.student_confirmed_at);
    const providerOk = Boolean(course.provider_confirmed_at);
    if (studentOk && providerOk) {
      await supabaseAdmin
        .from("courses")
        .update({ confirmation_escalated_at: now.toISOString() })
        .eq("id", course.id);
      continue;
    }

    const missingParty: "student" | "provider" | "both" =
      !studentOk && !providerOk
        ? "both"
        : !studentOk
          ? "student"
          : "provider";

    try {
      await notifyCourseConfirmationEscalation(course, missingParty);
      await supabaseAdmin
        .from("courses")
        .update({ confirmation_escalated_at: now.toISOString() })
        .eq("id", course.id);
      stats.escalationsSent += 1;
    } catch (err) {
      stats.errors.push(
        `escalation ${course.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

async function processExpiredReplacements(
  stats: CourseSessionJobStats,
  now: Date,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, scheduled_at, subject, title, client_id, provider_id, replacement_expires_at, status",
    )
    .eq("status", "awaiting_replacement")
    .not("replacement_expires_at", "is", null);

  if (error) {
    stats.errors.push(`replacements: ${error.message}`);
    return;
  }

  for (const row of data ?? []) {
    const course = row as CourseRow;
    if (!isPastReplacementDeadline(course.replacement_expires_at, now)) {
      continue;
    }

    const { data: openNotif } = await supabaseAdmin
      .from("campus_notifications")
      .select("id")
      .eq("course_id", course.id)
      .eq("replacement_status", "open")
      .limit(1)
      .maybeSingle();

    if (!openNotif) continue;

    const result = await refundCoursePayment(
      course.id,
      "Délai de remplacement dépassé (2 h avant le cours).",
    );
    if (result.ok) {
      stats.replacementsRefunded += 1;
    } else {
      stats.errors.push(`refund ${course.id}: ${result.error}`);
    }
  }
}

async function processPostSessionReminders(
  stats: CourseSessionJobStats,
  now: Date,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, scheduled_at, subject, title, client_id, provider_id, student_session_confirmed_at, provider_session_confirmed_at, session_confirm_reminder_count, session_dispute_status, status",
    )
    .eq("status", "awaiting_session_confirmation")
    .eq("session_dispute_status", "none")
    .not("scheduled_at", "is", null);

  if (error) {
    if (isPostSessionSchemaMissing(error.message)) {
      stats.warnings.push(
        "postSessionReminders: migration 030 absente — étape ignorée (appliquez supabase/migrations/030_post_session_confirmation.sql)",
      );
      return;
    }
    stats.errors.push(`postSessionReminders: ${error.message}`);
    return;
  }

  for (const row of data ?? []) {
    const course = row as CourseRow;
    if (
      course.student_session_confirmed_at &&
      course.provider_session_confirmed_at
    ) {
      continue;
    }

    const count = Number(course.session_confirm_reminder_count ?? 0);
    if (!shouldSendPostSessionReminder(course.scheduled_at, count, now)) {
      continue;
    }
    if (!course.campus_id || !course.client_id || !course.provider_id) continue;

    try {
      await notifySessionConfirmReminder({
        campusId: course.campus_id,
        courseId: course.id,
        clientId: course.client_id,
        providerId: course.provider_id,
        subject: course.subject ?? course.title ?? "Cours",
        declaredBy: course.provider_id,
      });
      await supabaseAdmin
        .from("courses")
        .update({
          session_confirm_reminder_sent_at: now.toISOString(),
          session_confirm_reminder_count: count + 1,
        })
        .eq("id", course.id);
      stats.postSessionRemindersSent += 1;
    } catch (err) {
      stats.errors.push(
        `postSessionReminder ${course.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

async function processSessionConfirmationDisputes(
  stats: CourseSessionJobStats,
  now: Date,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, scheduled_at, subject, title, client_id, provider_id, student_session_confirmed_at, provider_session_confirmed_at, session_dispute_status, status",
    )
    .eq("status", "awaiting_session_confirmation")
    .eq("session_dispute_status", "none")
    .not("scheduled_at", "is", null);

  if (error) {
    if (isPostSessionSchemaMissing(error.message)) {
      stats.warnings.push(
        "sessionDisputes: migration 030 absente — étape ignorée (appliquez supabase/migrations/030_post_session_confirmation.sql)",
      );
      return;
    }
    stats.errors.push(`sessionDisputes: ${error.message}`);
    return;
  }

  for (const row of data ?? []) {
    const course = row as CourseRow;
    if (!isPastSessionConfirmationDispute(course.scheduled_at, now)) continue;
    if (
      course.student_session_confirmed_at &&
      course.provider_session_confirmed_at
    ) {
      continue;
    }
    if (!course.campus_id || !course.client_id || !course.provider_id) continue;

    try {
      await supabaseAdmin
        .from("courses")
        .update({ session_dispute_status: "open" })
        .eq("id", course.id);

      await notifySessionDispute({
        campusId: course.campus_id,
        courseId: course.id,
        clientId: course.client_id,
        providerId: course.provider_id,
        subject: course.subject ?? course.title ?? "Cours",
        declaredBy: course.provider_id,
      });
      stats.sessionDisputesOpened += 1;
    } catch (err) {
      stats.errors.push(
        `sessionDispute ${course.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
