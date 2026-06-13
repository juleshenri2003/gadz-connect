import type { AdminDashboardData, AdminMe } from "@/features/admin/types";
import { addDays, startOfWeek } from "@/features/scheduling/calendar-utils";
import { useAdminSchedule } from "@/features/scheduling/useSchedule";
import { useAdminPilotageTasks } from "@/features/dashboard/useAdminPilotageTasks";
import { countOpenReplacements } from "@/features/notifications/notificationUtils";
import { useNotifications } from "@/features/notifications/useNotifications";
import { AdminAgendaFeed } from "./AdminAgendaFeed";
import {
  AdminCampusBreakdown,
  AdminCoursesAtRisk,
} from "./AdminCampusBreakdown";
import { AdminCockpitHeader } from "./AdminCockpitHeader";
import { AdminPilotageStatsRow } from "./AdminPilotageStatsRow";
import { AdminPlatformHealth } from "./AdminPlatformHealth";
import { AdminRecentActivity } from "./AdminRecentActivity";
import { AdminStudentsSnapshot } from "./AdminStudentsSnapshot";
import { AdminTeachersOnboardingPanel } from "./AdminTeachersOnboardingPanel";
import { AdminUrgentStrip } from "./AdminUrgentStrip";
import { AdminWeekStrip } from "./AdminWeekStrip";
import { countOpenReplacementTasks } from "./adminCockpitUtils";

interface AdminCockpitProps {
  dashboard: AdminDashboardData;
  me: AdminMe | undefined;
}

export function AdminCockpit({ dashboard, me }: AdminCockpitProps) {
  const weekStart = startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 7);
  const { data: schedule } = useAdminSchedule({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });
  const { tasks } = useAdminPilotageTasks();
  const { data: notifications } = useNotifications();

  const events = schedule?.events ?? [];
  const openReplacements = Math.max(
    countOpenReplacementTasks(tasks),
    countOpenReplacements(notifications),
  );
  const awaitingReplacement =
    dashboard.courses.byStatus.awaiting_replacement ?? 0;
  const cancelled = dashboard.courses.byStatus.cancelled ?? 0;

  return (
    <div className="space-y-6">
      <AdminCockpitHeader me={me} scope={dashboard.scope} />

      <AdminUrgentStrip />

      <AdminPilotageStatsRow
        dashboard={dashboard}
        openReplacements={openReplacements}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminWeekStrip events={events} />
          <AdminAgendaFeed events={events} />
          <AdminRecentActivity dashboard={dashboard} />
          <AdminCoursesAtRisk
            awaitingReplacement={awaitingReplacement}
            cancelled={cancelled}
          />
          {dashboard.scope === "global" && dashboard.byCampus ? (
            <AdminCampusBreakdown rows={dashboard.byCampus} />
          ) : null}
        </div>

        <div className="space-y-6">
          <AdminTeachersOnboardingPanel dashboard={dashboard} />
          <AdminStudentsSnapshot
            dashboard={dashboard}
            openReplacements={openReplacements}
          />
          <AdminPlatformHealth dashboard={dashboard} />
        </div>
      </div>
    </div>
  );
}
