import type { AdminCourseDetail, AdminCourseRow } from "@/features/admin/types";
import type { ScheduleEvent } from "@/features/scheduling/types";

export function formatCourseSessionWhen(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt) return "—";
  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const startLabel = dateFmt.format(new Date(startsAt));
  if (!endsAt) return startLabel;
  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = timeFmt.format(new Date(endsAt));
  return `${startLabel} – ${endTime}`;
}

export function courseRowToScheduleEvent(
  course: AdminCourseRow | AdminCourseDetail,
): ScheduleEvent {
  const startsAt =
    course.starts_at ?? course.scheduled_at ?? course.created_at;
  const endsAt =
    course.ends_at ??
    new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();

  return {
    id: course.id,
    courseId: course.id,
    clientId: course.client_id ?? undefined,
    providerId: course.provider_id ?? undefined,
    campusId: course.campus_id,
    campusName: course.campus?.name,
    hasSummary: course.has_summary,
    summaryId: "summary_id" in course ? (course.summary_id ?? undefined) : undefined,
    cancellationNotificationId:
      course.cancellation_notification_id ?? undefined,
    title: course.subject || course.title,
    startsAt,
    endsAt,
    kind: "course",
    status: course.status,
    providerName: course.provider_name ?? undefined,
    clientName: course.client_name ?? undefined,
  };
}

export function courseDisplayTitle(course: AdminCourseRow): string {
  return course.subject?.trim() || course.title;
}
