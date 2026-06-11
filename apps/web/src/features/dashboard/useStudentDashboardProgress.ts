import { useMyProfile } from "@/features/auth/useMyProfile";
import { useTutors } from "@/features/marketplace/useTutors";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import type { DashboardProgress } from "./dashboardTypes";
import { computeStudentDashboardProgress } from "./studentDashboardTasks";

export function useStudentDashboardProgress() {
  const profileQuery = useMyProfile();
  const scheduleQuery = useMySchedule();
  const tutorsQuery = useTutors();

  const progress: DashboardProgress | null = profileQuery.data
    ? computeStudentDashboardProgress(
        profileQuery.data,
        scheduleQuery.data?.events,
        tutorsQuery.data?.length ?? 0,
      )
    : null;

  return {
    progress,
    profile: profileQuery.data,
    tutorCount: tutorsQuery.data?.length ?? 0,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
  };
}
