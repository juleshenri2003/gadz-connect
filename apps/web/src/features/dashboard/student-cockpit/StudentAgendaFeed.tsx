import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { planningWeekLink } from "./studentCockpitUtils";

interface StudentAgendaFeedProps {
  events: ScheduleEvent[];
}

export function StudentAgendaFeed({ events }: StudentAgendaFeedProps) {
  const courses = events.filter((event) => event.kind === "course");

  return (
    <TeacherAgendaList
      events={courses}
      variant="compact"
      showHeader
      headerTitle="Mes prochains cours"
      headerDescription="Vos sessions de tutorat confirmées."
      headerLink={{
        label: "Calendrier →",
        to: planningWeekLink(courses),
      }}
    />
  );
}
