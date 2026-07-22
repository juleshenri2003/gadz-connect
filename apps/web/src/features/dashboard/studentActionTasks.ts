import type { MyProfile } from "@/features/auth/useMyProfile";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress } from "./dashboardTypes";
import {
  alertItemsToTasks,
  dedupeConfirmTasks,
  finalizeTaskProgress,
  sessionConfirmTasksFromEvents,
} from "./dashboardActionUtils";
import { computeStudentDashboardProgress } from "./studentDashboardTasks";

export function computeStudentActionTasks(
  profile: MyProfile,
  events: ScheduleEvent[] | undefined,
  campusTutorCount: number,
  notifications: CampusNotificationItem[] | undefined,
): DashboardProgress {
  const tasks: DashboardProgress["tasks"] = [];

  const onboarding = computeStudentDashboardProgress(
    profile,
    events,
    campusTutorCount,
  );
  for (const task of onboarding.tasks) {
    if (task.status === "todo") {
      tasks.push({ ...task, kind: task.kind ?? "onboarding" });
    }
  }

  tasks.push(...sessionConfirmTasksFromEvents(events, "student"));
  tasks.push(
    ...alertItemsToTasks(notifications, 5, {
      events,
      audience: "student",
    }),
  );

  return finalizeTaskProgress(dedupeConfirmTasks(tasks));
}
