export type ScheduleEventKind = "course" | "slot_available" | "slot_booked";

export interface ScheduleEvent {
  id: string;
  courseId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: ScheduleEventKind;
  status?: string;
  counterpartName?: string;
  providerName?: string;
  clientName?: string;
  campusName?: string;
}
