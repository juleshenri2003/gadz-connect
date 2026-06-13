import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { getUpcomingAdminEvents } from "./adminCockpitUtils";

interface AdminAgendaFeedProps {
  events: ScheduleEvent[];
}

export function AdminAgendaFeed({ events }: AdminAgendaFeedProps) {
  const upcoming = getUpcomingAdminEvents(events, 5);

  return (
    <TeacherAgendaList
      events={upcoming}
      variant="compact"
      showHeader
      headerTitle="Prochaines sessions"
      headerDescription="Cours planifiés sur votre périmètre."
      headerLink={{
        label: "Emploi du temps →",
        to: "/admin/planning",
      }}
    />
  );
}
