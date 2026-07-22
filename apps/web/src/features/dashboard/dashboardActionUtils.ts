import {
  buildPlanningWeekHref,
} from "@/features/notifications/notificationUtils";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardTask } from "./dashboardTypes";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { needsOwnAttendanceConfirm } from "@/features/scheduling/PastCoursesPanel";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";

/** Kinds that warrant a dashboard action / popup. */
export const ACTIONABLE_ALERT_KINDS = new Set([
  "course_confirmation_reminder",
  "course_confirmation_escalation",
  "session_confirm_reminder",
  "replacement_offer",
  "replacement_candidate",
  "course_follow_up",
  "urssaf_payment_rejected",
  "urssaf_payout_pending",
]);

const CONFIRM_ALERT_KINDS = new Set([
  "course_confirmation_reminder",
  "course_confirmation_escalation",
  "session_confirm_reminder",
]);

export function isActionableUnreadAlert(
  item: CampusNotificationItem,
): boolean {
  if (item.read_at) return false;
  const kind = item.notification?.kind;
  return Boolean(kind && ACTIONABLE_ALERT_KINDS.has(kind));
}

export function getActionableUnreadAlerts(
  notifications: CampusNotificationItem[] | undefined,
): CampusNotificationItem[] {
  return (notifications ?? []).filter(isActionableUnreadAlert);
}

function alertHref(item: CampusNotificationItem): string {
  return `/app/alertes?focus=${encodeURIComponent(item.id)}`;
}

export function alertItemsToTasks(
  notifications: CampusNotificationItem[] | undefined,
  limit = 5,
  options?: {
    events?: ScheduleEvent[];
    audience?: "student" | "teacher";
  },
): DashboardTask[] {
  const events = options?.events;
  const audience = options?.audience;

  return getActionableUnreadAlerts(notifications)
    .filter((item) => {
      const n = item.notification;
      if (!n || !CONFIRM_ALERT_KINDS.has(n.kind)) return true;
      const courseId = n.course_id;
      if (!courseId || !events || !audience) return true;
      const event = events.find(
        (e) => e.kind === "course" && e.courseId === courseId,
      );
      // Déjà confirmé de mon côté → plus d'action inbox
      if (event && !needsOwnAttendanceConfirm(event, audience)) return false;
      if (audience === "student" && n.studentSessionConfirmedAt) return false;
      if (audience === "teacher" && n.providerSessionConfirmedAt) return false;
      return true;
    })
    .slice(0, limit)
    .map((item) => {
      const n = item.notification!;
      const isConfirm = CONFIRM_ALERT_KINDS.has(n.kind);
      const courseId = n.course_id ?? undefined;

      return {
        id: `alert-${item.id}`,
        title: n.title,
        description:
          isConfirm
            ? "Confirmer la séance"
            : n.kind === "replacement_offer" ||
                n.kind === "replacement_candidate"
              ? "Répondre au remplacement"
              : "Consulter l'alerte",
        href: alertHref(item),
        status: "todo" as const,
        kind: isConfirm
          ? ("confirm" as const)
          : ("alert" as const),
        courseId,
        openCourse: Boolean(isConfirm && courseId),
      };
    });
}

export function sessionConfirmTasksFromEvents(
  events: ScheduleEvent[] | undefined,
  audience: "student" | "teacher",
  limit = 4,
): DashboardTask[] {
  const now = Date.now();
  const pastCourses = (events ?? [])
    .filter(
      (e) =>
        e.kind === "course" &&
        e.courseId &&
        new Date(e.startsAt).getTime() <= now &&
        needsOwnAttendanceConfirm(e, audience),
    )
    .slice(0, limit);

  return pastCourses.map((event) => ({
    id: `confirm-${event.courseId}`,
    title: `Confirmer — ${event.title}`,
    description:
      audience === "student"
        ? `Séance avec ${event.counterpartName ?? "le professeur"}`
        : `Séance avec ${event.counterpartName ?? event.clientName ?? "l'élève"}`,
    href: buildPlanningWeekHref(event.startsAt),
    status: "todo" as const,
    kind: "confirm" as const,
    courseId: event.courseId!,
    openCourse: true,
  }));
}

export function documentTasksFromEvents(
  events: ScheduleEvent[] | undefined,
  limit = 4,
): DashboardTask[] {
  const now = Date.now();
  return (events ?? [])
    .filter(
      (e) =>
        e.kind === "course" &&
        e.courseId &&
        !e.hasSummary &&
        e.status !== "cancelled" &&
        new Date(e.startsAt).getTime() <= now,
    )
    .slice(0, limit)
    .map((event) => ({
      id: `doc-${event.courseId}`,
      title: `Déposer le résumé — ${event.title}`,
      description: `Élève : ${event.counterpartName ?? event.clientName ?? "—"}`,
      href: coursesTabHref("history"),
      status: "todo" as const,
      kind: "document" as const,
      courseId: event.courseId!,
    }));
}

/** Évite le doublon confirmation (événement + alerte) pour le même cours. */
export function dedupeConfirmTasks(tasks: DashboardTask[]): DashboardTask[] {
  const seenCourseIds = new Set<string>();
  const result: DashboardTask[] = [];

  for (const task of tasks) {
    if (task.kind === "confirm" && task.courseId) {
      if (seenCourseIds.has(task.courseId)) continue;
      seenCourseIds.add(task.courseId);
    }
    result.push(task);
  }

  return result;
}

export function finalizeTaskProgress(
  tasks: DashboardTask[],
): import("./dashboardTypes").DashboardProgress {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const percent =
    totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);
  return {
    tasks,
    completedCount,
    totalCount,
    percent,
    isComplete: tasks.filter((t) => t.status === "todo").length === 0,
  };
}

export function eventsForDayIso(
  events: ScheduleEvent[],
  dayIso: string,
): ScheduleEvent[] {
  return events.filter((event) => event.startsAt.slice(0, 10) === dayIso);
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDayIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function alertsPopupStorageKey(userId: string): string {
  const day = toDayIso(new Date());
  return `gadz-dashboard-alerts-dismissed:${userId}:${day}`;
}

export function wasAlertsPopupDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(alertsPopupStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function dismissAlertsPopup(userId: string): void {
  try {
    sessionStorage.setItem(alertsPopupStorageKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export function findCourseEvent(
  events: ScheduleEvent[] | undefined,
  courseId: string,
): ScheduleEvent | undefined {
  return (events ?? []).find(
    (e) => e.kind === "course" && e.courseId === courseId,
  );
}
