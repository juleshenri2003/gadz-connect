import type { ScheduleEvent } from "@/features/scheduling/types";
import type { TutorSlot } from "@/features/marketplace/useTutors";
import {
  addDays,
  eventsForDay,
  formatEventTime,
  getWeekDays,
  startOfWeek,
} from "@/features/scheduling/calendar-utils";
import { calculateCommissionSasu } from "@gadz-connect/types";

const URSSAF_RATE_FULL = 0.211;
const URSSAF_RATE_ACRE = 0.106;
const LIBERATOIRE_RATE = 0.022;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateNetPayout(
  amountGross: number,
  statusAcre: boolean,
  versementLiberatoire: boolean,
): number {
  const commissionSasu = calculateCommissionSasu(amountGross);
  const baseAfterCommission = round2(amountGross - commissionSasu);
  const urssafRate = statusAcre ? URSSAF_RATE_ACRE : URSSAF_RATE_FULL;
  const taxesUrssaf = round2(baseAfterCommission * urssafRate);
  const liberatoireRate = versementLiberatoire ? LIBERATOIRE_RATE : 0;
  const taxesLiberatoire = round2(baseAfterCommission * liberatoireRate);
  return round2(amountGross - commissionSasu - taxesUrssaf - taxesLiberatoire);
}

export function sessionDurationHours(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function getFutureSlots(slots: TutorSlot[] | undefined): TutorSlot[] {
  const now = Date.now();
  return (slots ?? [])
    .filter((slot) => new Date(slot.starts_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
}

export function needsHourlyRate(hourlyRate: number | null | undefined): boolean {
  return hourlyRate == null || hourlyRate <= 0;
}

export function isConfirmedSession(event: ScheduleEvent): boolean {
  return event.kind === "course" || event.kind === "slot_booked";
}

export function getCourseCounterpart(event: ScheduleEvent): string {
  return event.counterpartName ?? event.clientName ?? "Élève";
}

export function getSessionLabel(event: ScheduleEvent): string {
  if (event.kind === "slot_available") return "Créneau ouvert";
  return getCourseCounterpart(event);
}

export function getUpcomingEvents(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  const now = Date.now();
  return (events ?? [])
    .filter((event) => new Date(event.startsAt).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

export function getPastEvents(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  const now = Date.now();
  return (events ?? [])
    .filter(
      (event) =>
        isConfirmedSession(event) && new Date(event.startsAt).getTime() <= now,
    )
    .sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
}

export function getNextSession(
  events: ScheduleEvent[],
): ScheduleEvent | undefined {
  const confirmed = events.filter(isConfirmedSession);
  if (confirmed.length > 0) return confirmed[0];
  return events.find((event) => event.kind === "slot_available");
}

export function formatSessionDate(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatSessionWhen(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${date} · ${formatEventTime(startsAt, endsAt)}`;
}

export function formatRelativeWhen(startsAt: string): string {
  const start = new Date(startsAt);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return "Passé";
  if (diffHours < 1) return "Dans moins d'une heure";
  if (diffHours < 24) return `Dans ${diffHours} h`;
  if (diffDays === 1) return "Demain";
  if (diffDays < 7) return `Dans ${diffDays} jours`;
  return start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function estimateSessionNet(
  event: ScheduleEvent,
  hourlyRate: number | null,
  statusAcre: boolean,
  versementLiberatoire: boolean,
): number | null {
  if (!hourlyRate || hourlyRate <= 0) return null;
  const hours = sessionDurationHours(event.startsAt, event.endsAt);
  if (hours <= 0) return null;
  const gross = round2(hourlyRate * hours);
  return estimateNetPayout(gross, statusAcre, versementLiberatoire);
}

export function getCurrentWeekDays(anchor = new Date()): Date[] {
  return getWeekDays(startOfWeek(anchor));
}

export function countWeekEventsByDay(
  events: ScheduleEvent[],
  day: Date,
): { courses: number; slots: number } {
  const dayEvents = eventsForDay(events, day);
  return {
    courses: dayEvents.filter(isConfirmedSession).length,
    slots: dayEvents.filter((event) => event.kind === "slot_available").length,
  };
}

export function isToday(day: Date): boolean {
  return day.toDateString() === new Date().toDateString();
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}
