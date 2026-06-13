import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  getPastEvents,
  getUpcomingEvents,
  sessionDurationHours,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

export function getStudentCourseEvents(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  return (events ?? []).filter((event) => event.kind === "course");
}

export function getNextStudentCourse(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent | undefined {
  const upcoming = getUpcomingEvents(getStudentCourseEvents(events));
  return upcoming[0];
}

export function getPastStudentCourses(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  return getPastEvents(getStudentCourseEvents(events));
}

export function getUpcomingStudentCourses(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  return getUpcomingEvents(getStudentCourseEvents(events));
}

export function getTutorName(event: ScheduleEvent): string {
  return event.counterpartName ?? event.providerName ?? "Tuteur";
}

export interface StudentDashboardStats {
  upcomingCount: number;
  tutoringHours: number;
  tutorCount: number;
  summariesCount: number;
}

export function computeStudentDashboardStats(
  events: ScheduleEvent[] | undefined,
): StudentDashboardStats {
  const courses = getStudentCourseEvents(events);
  const now = Date.now();
  const upcoming = courses.filter(
    (event) => new Date(event.startsAt).getTime() > now,
  );
  const past = courses.filter(
    (event) => new Date(event.startsAt).getTime() <= now,
  );

  const tutorNames = new Set(
    courses
      .map((event) => getTutorName(event))
      .filter((name) => name !== "Tuteur"),
  );

  const tutoringHours = past.reduce(
    (sum, event) => sum + sessionDurationHours(event.startsAt, event.endsAt),
    0,
  );

  return {
    upcomingCount: upcoming.length,
    tutoringHours: Math.round(tutoringHours * 10) / 10,
    tutorCount: tutorNames.size,
    summariesCount: past.filter((event) => event.hasSummary).length,
  };
}

export function formatTutoringHours(hours: number): string {
  if (hours === 0) return "0 h";
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

export function planningWeekLink(events: ScheduleEvent[]): string {
  const upcoming = getUpcomingStudentCourses(events);
  const next = upcoming[0];
  if (!next) return "/app/planning";
  const day = next.startsAt.slice(0, 10);
  return `/app/planning?week=${day}`;
}
