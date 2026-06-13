import { AdminCockpit } from "@/features/dashboard/admin-cockpit/AdminCockpit";
import { AdminCockpitSkeleton } from "@/features/dashboard/admin-cockpit/AdminCockpitSkeleton";
import { useAdminDashboard, useAdminMe } from "@/features/admin/useAdmin";

export function AdminOverviewPage() {
  const { data: dashboard, isLoading, isError, error } = useAdminDashboard();
  const { data: me } = useAdminMe();

  if (isLoading) {
    return <AdminCockpitSkeleton />;
  }

  if (isError || !dashboard) {
    return (
      <p className="text-sm text-danger">
        {(error as Error)?.message ?? "Impossible de charger le tableau de bord"}
      </p>
    );
  }

  return <AdminCockpit dashboard={dashboard} me={me} />;
}
