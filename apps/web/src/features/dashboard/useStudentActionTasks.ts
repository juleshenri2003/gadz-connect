import { useMyProfile } from "@/features/auth/useMyProfile";
import { useTutors } from "@/features/marketplace/useTutors";
import { useNotifications } from "@/features/notifications/useNotifications";
import { usePendingReplacementsForStudent } from "@/features/replacements/useReplacements";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import { computeStudentActionTasks } from "./studentActionTasks";

export function useStudentActionTasks() {
  const profileQuery = useMyProfile();
  const scheduleQuery = useMySchedule();
  const tutorsQuery = useTutors();
  const notificationsQuery = useNotifications();
  const pendingQuery = usePendingReplacementsForStudent();

  const profile = profileQuery.data;
  const progress = profile
    ? computeStudentActionTasks(
        profile,
        scheduleQuery.data?.events,
        tutorsQuery.data?.length ?? 0,
        notificationsQuery.data,
        pendingQuery.data,
      )
    : {
        tasks: [],
        completedCount: 0,
        totalCount: 0,
        percent: 100,
        isComplete: true,
      };

  const isLoading =
    profileQuery.isLoading ||
    scheduleQuery.isLoading ||
    notificationsQuery.isLoading;

  return {
    progress,
    tasks: progress.tasks,
    isLoading,
    showBanner: Boolean(profile),
  };
}
