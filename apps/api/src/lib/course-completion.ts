import { supabaseAdmin } from "./supabase.js";
import { notifySessionConfirmReminder } from "./notification-helpers.js";

/** Passe les cours passés encore « scheduled » en attente de double confirmation. */
export async function markPastCoursesCompleted(): Promise<void> {
  const now = new Date().toISOString();

  const { data: pastCourses } = await supabaseAdmin
    .from("courses")
    .select("id, campus_id, client_id, provider_id, subject, title")
    .eq("status", "scheduled")
    .lt("scheduled_at", now);

  if (!pastCourses?.length) return;

  const ids = pastCourses.map((c) => c.id as string);

  const { error: statusError } = await supabaseAdmin
    .from("courses")
    .update({ status: "awaiting_session_confirmation" })
    .in("id", ids);

  // Migration 030 pas encore appliquée : revenir au comportement legacy.
  if (statusError) {
    console.warn(
      "[course-completion] awaiting_session_confirmation indisponible — fallback completed:",
      statusError.message,
    );
    await supabaseAdmin
      .from("courses")
      .update({ status: "completed" })
      .in("id", ids);
    return;
  }

  for (const course of pastCourses) {
    if (!course.campus_id || !course.client_id || !course.provider_id) continue;
    try {
      await notifySessionConfirmReminder({
        campusId: course.campus_id as string,
        courseId: course.id as string,
        clientId: course.client_id as string,
        providerId: course.provider_id as string,
        subject:
          (course.subject as string | null) ??
          (course.title as string | null) ??
          "Cours",
        declaredBy: course.provider_id as string,
      });
      await supabaseAdmin
        .from("courses")
        .update({
          session_confirm_reminder_sent_at: now,
          session_confirm_reminder_count: 1,
        })
        .eq("id", course.id);
    } catch (err) {
      console.error(
        "[course-completion] reminder",
        course.id,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

export function isCourseFollowUpEligible(course: {
  status: string;
  scheduled_at: string | null;
}): boolean {
  if (
    course.status === "completed" ||
    course.status === "awaiting_session_confirmation"
  ) {
    return true;
  }
  if (course.status === "scheduled" && course.scheduled_at) {
    return new Date(course.scheduled_at).getTime() < Date.now();
  }
  return false;
}
