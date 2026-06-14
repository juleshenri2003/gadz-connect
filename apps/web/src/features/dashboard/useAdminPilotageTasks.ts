import { useAdminDashboard, useAdminProfiles } from "@/features/admin/useAdmin";
import { useNotifications } from "@/features/notifications/useNotifications";
import { computeAdminPilotageTasks } from "./adminPilotageTasks";

export function useAdminPilotageTasks() {
  const dashboardQuery = useAdminDashboard();
  const profilesQuery = useAdminProfiles();
  const notificationsQuery = useNotifications();

  const progress = computeAdminPilotageTasks(
    profilesQuery.data?.profiles,
    notificationsQuery.data,
    dashboardQuery.data?.profiles.byStatus.suspended ?? 0,
  );

  const isLoading =
    dashboardQuery.isLoading ||
    profilesQuery.isLoading ||
    notificationsQuery.isLoading;

  return {
    progress,
    tasks: progress.tasks,
    isLoading,
    isError:
      dashboardQuery.isError ||
      profilesQuery.isError ||
      notificationsQuery.isError,
  };
}
