import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { getUpcomingEvents, isConfirmedSession } from "./teacherCockpitUtils";

interface TeacherAgendaFeedProps {
  events: ScheduleEvent[];
  headerTitle?: string;
  headerDescription?: string;
  showHistory?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
}

function planningWeekLink(events: ScheduleEvent[]): string {
  const upcoming = getUpcomingEvents(events);
  const next =
    upcoming.find(isConfirmedSession) ?? upcoming[0] ?? undefined;
  if (!next) return "/app/planning";
  const day = next.startsAt.slice(0, 10);
  return `/app/planning?week=${day}`;
}

export function TeacherAgendaFeed({
  events,
  headerTitle = "Agenda à venir",
  headerDescription = "Sessions confirmées et créneaux publiés.",
  showHistory = false,
  onEventClick,
}: TeacherAgendaFeedProps) {
  return (
    <TeacherAgendaList
      events={events}
      variant="compact"
      showHeader
      showHistory={showHistory}
      headerTitle={headerTitle}
      headerDescription={headerDescription}
      headerLink={{
        label: "Calendrier →",
        to: planningWeekLink(events),
      }}
      onEventClick={onEventClick}
      renderEventActions={(event) =>
        event.courseId && event.status === "scheduled" ? (
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
