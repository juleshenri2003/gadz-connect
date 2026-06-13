import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { getUpcomingEvents, isConfirmedSession } from "./teacherCockpitUtils";

interface TeacherAgendaFeedProps {
  events: ScheduleEvent[];
}

function planningWeekLink(events: ScheduleEvent[]): string {
  const upcoming = getUpcomingEvents(events);
  const next =
    upcoming.find(isConfirmedSession) ?? upcoming[0] ?? undefined;
  if (!next) return "/app/planning";
  const day = next.startsAt.slice(0, 10);
  return `/app/planning?week=${day}`;
}

export function TeacherAgendaFeed({ events }: TeacherAgendaFeedProps) {
  return (
    <TeacherAgendaList
      events={events}
      variant="compact"
      showHeader
      headerTitle="Agenda à venir"
      headerDescription="Sessions confirmées et créneaux publiés."
      headerLink={{
        label: "Calendrier →",
        to: planningWeekLink(events),
      }}
      renderEventActions={(event) =>
        event.courseId &&
        (event.status === "scheduled" ||
          event.status === "awaiting_replacement") ? (
          <DeclareUnavailableButton
            courseId={event.courseId}
            eventTitle={event.title}
            courseStatus={event.status}
            compact
          />
        ) : null
      }
    />
  );
}
