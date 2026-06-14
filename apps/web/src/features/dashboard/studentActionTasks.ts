import type { MyProfile } from "@/features/auth/useMyProfile";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress } from "./dashboardTypes";
import { computeStudentDashboardProgress } from "./studentDashboardTasks";

export function computeStudentActionTasks(
  profile: MyProfile,
  events: ScheduleEvent[] | undefined,
  campusTutorCount: number,
  _notifications: CampusNotificationItem[] | undefined,
): DashboardProgress {
  const tasks: DashboardProgress["tasks"] = [];

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
