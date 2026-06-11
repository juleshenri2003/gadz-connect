import type { MyProfile } from "@/features/auth/useMyProfile";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { PendingReplacementAlert } from "@/features/replacements/useReplacements";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";
import { computeStudentDashboardProgress } from "./studentDashboardTasks";

export function computeStudentActionTasks(
  profile: MyProfile,
  events: ScheduleEvent[] | undefined,
  campusTutorCount: number,
  notifications: CampusNotificationItem[] | undefined,
  pendingReplacements: PendingReplacementAlert[] | undefined,
): DashboardProgress {
  const tasks: DashboardTask[] = [];

  const pending = pendingReplacements ?? [];
  if (pending.length > 0) {
    const totalProposals = pending.reduce(
      (sum, p) => sum + p.pendingProposalsCount,
      0,
    );
    tasks.push({
      id: "choose-replacement",
      title: `Choisir un remplaçant (${totalProposals} proposition${totalProposals > 1 ? "s" : ""})`,
      description:
        "Votre professeur est indisponible — validez un remplaçant pour garder le même horaire",
      href: "/app/alertes",
      status: "todo",
    });
  }

  const openProfUnavailable =
    notifications?.filter(
      (n) =>
        !n.read_at &&
        n.notification?.kind === "prof_unavailable" &&
        n.notification.replacement_status === "open",
    ) ?? [];

  if (openProfUnavailable.length > 0 && pending.length === 0) {
    tasks.push({
      id: "replacement-waiting",
      title: "Remplacement de cours en cours",
      description:
        "En attente de propositions de professeurs — consultez vos alertes",
      href: "/app/alertes",
      status: "todo",
    });
  }

  const onboarding = computeStudentDashboardProgress(
    profile,
    events,
    campusTutorCount,
  );
  for (const task of onboarding.tasks) {
    if (task.status === "todo") {
      tasks.push({ ...task });
    }
  }

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const percent =
    totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

  return {
    tasks,
    completedCount,
    totalCount,
    percent,
    isComplete: tasks.length === 0,
  };
}
