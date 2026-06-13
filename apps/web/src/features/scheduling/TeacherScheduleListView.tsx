import { TeacherAgendaList } from "./TeacherAgendaList";
import type { ScheduleEvent } from "./types";
import type { ReactNode } from "react";

interface TeacherScheduleListViewProps {
  events: ScheduleEvent[];
  showHistory?: boolean;
  loading?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
}

/** @deprecated Préférer TeacherAgendaList directement */
export function TeacherScheduleListView({
  events,
  showHistory,
  loading,
  onEventClick,
  renderEventActions,
}: TeacherScheduleListViewProps) {
  return (
    <TeacherAgendaList
      events={events}
      variant="full"
      showHistory={showHistory}
      loading={loading}
      onEventClick={onEventClick}
      renderEventActions={renderEventActions}
    />
  );
}
