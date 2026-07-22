import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { planningWeekLink } from "./studentCockpitUtils";

interface StudentAgendaFeedProps {
  events: ScheduleEvent[];
  headerTitle?: string;
  headerDescription?: string;
  showHistory?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  emptyMessage?: string;
}

export function StudentAgendaFeed({
  events,
  headerTitle = "Mes prochains cours",
  headerDescription = "Vos sessions de tutorat confirmées.",
  showHistory = false,
  onEventClick,
}: StudentAgendaFeedProps) {
  const courses = events.filter((event) => event.kind === "course");

  return (
    <TeacherAgendaList
      events={courses}
      variant="compact"
      showHeader
      showHistory={showHistory}
      headerTitle={headerTitle}
      headerDescription={headerDescription}
      headerLink={{
        label: "Calendrier →",
        to: planningWeekLink(courses),
      }}
      onEventClick={onEventClick}
    />
  );
}
