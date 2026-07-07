import type { CampusNotificationItem } from "@/features/notifications/useNotifications";

const STUDENT_NAV_PATHS = [
  "/app",
  "/app/planning",
  "/app/alertes",
  "/app/suivi-cours",
  "/app/repertoire",
  "/app/cours",
  "/app/factures",
  "/app/profil",
] as const;

export function countUnreadRepositoryDocuments(
  notifications: CampusNotificationItem[] | undefined,
): number {
  return (
    notifications?.filter(
      (item) =>
        !item.read_at && item.notification?.kind === "course_follow_up",
    ).length ?? 0
  );
}

export function computeStudentNavBadgeCounts(
  notifications: CampusNotificationItem[] | undefined,
): Record<string, number> {
  const counts = Object.fromEntries(
    STUDENT_NAV_PATHS.map((path) => [path, 0]),
  ) as Record<string, number>;

  const unread = notifications?.filter((item) => !item.read_at) ?? [];
  counts["/app/alertes"] = unread.length;
  counts["/app/repertoire"] = unread.filter(
    (item) => item.notification?.kind === "course_follow_up",
  ).length;

  return counts;
}
