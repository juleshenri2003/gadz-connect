import { TeacherWeekStrip } from "@/features/dashboard/teacher-cockpit/TeacherWeekStrip";
import type { ScheduleEvent } from "@/features/scheduling/types";

interface AdminWeekStripProps {
  events: ScheduleEvent[];
}

export function AdminWeekStrip({ events }: AdminWeekStripProps) {
  return <TeacherWeekStrip events={events} variant="student" />;
}
