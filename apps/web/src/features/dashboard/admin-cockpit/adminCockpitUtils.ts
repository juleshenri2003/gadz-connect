import type { AccountStatus } from "@gadz-connect/types";
import type { AdminDashboardData } from "@/features/admin/types";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { getUpcomingEvents } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

export function getRoleStatusCount(
  dashboard: AdminDashboardData,
  role: string,
  status: AccountStatus,
): number {
  return dashboard.profiles.byRoleAndStatus[role]?.[status] ?? 0;
}

export function countOpenReplacementTasks(
  tasks: Array<{ id: string; status: string }>,
): number {
  return tasks.filter(
    (task) =>
      task.status === "todo" &&
      (task.id === "review-replacements" ||
        task.id === "courses-awaiting-replacement"),
  ).length;
}

export function getUpcomingAdminEvents(
  events: ScheduleEvent[] | undefined,
  limit = 5,
): ScheduleEvent[] {
  return getUpcomingEvents(events).slice(0, limit);
}

export function formatAdminEventMeta(event: ScheduleEvent): string {
  const parts = [
    event.providerName ? `Prof : ${event.providerName}` : null,
    event.clientName ? `Élève : ${event.clientName}` : null,
    event.campusName,
  ].filter(Boolean);
  return parts.join(" · ");
}

const COURSE_STATUS_LABELS: Record<string, string> = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
  awaiting_replacement: "En attente de remplaçant",
};

export function courseStatusLabel(status: string): string {
  return COURSE_STATUS_LABELS[status] ?? status;
}

export function formatTodayDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
