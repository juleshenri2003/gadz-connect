import { isEventPast, isExpiredAvailableSlot } from "./calendar-utils";
import type { ScheduleEvent } from "./types";

/** Événements masqués par défaut (filtre « Afficher l'historique »). */
export function isHistoryEvent(event: ScheduleEvent): boolean {
  if (event.status === "cancelled" || event.status === "completed") {
    return true;
  }
  if (
    isExpiredAvailableSlot(event.kind, event.startsAt, event.endsAt)
  ) {
    return true;
  }
  if (
    isEventPast(event.startsAt, event.endsAt) &&
    (event.kind === "course" || event.kind === "slot_booked")
  ) {
    return true;
  }
  return false;
}

export function filterScheduleEvents(
  events: ScheduleEvent[],
  showHistory: boolean,
): ScheduleEvent[] {
  if (showHistory) return events;
  return events.filter((event) => !isHistoryEvent(event));
}

export function hasAwaitingReplacement(events: ScheduleEvent[]): boolean {
  return events.some((event) => event.status === "awaiting_replacement");
}
