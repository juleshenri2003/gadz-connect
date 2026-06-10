import type { ScheduleEvent } from "./types";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatWeekRange(anchor: Date): string {
  const days = getWeekDays(anchor);
  const first = days[0]!;
  const last = days[6]!;
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `${fmt.format(first)} — ${fmt.format(last)} ${last.getFullYear()}`;
}

export function formatDayHeader(date: Date): { weekday: string; day: string } {
  const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7] ?? "Lun";
  const day = String(date.getDate());
  return { weekday, day };
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventsForDay(events: ScheduleEvent[], day: Date): ScheduleEvent[] {
  return events.filter((event) => isSameDay(new Date(event.startsAt), day));
}

export function formatEventTime(startsAt: string, endsAt: string): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const start = fmt.format(new Date(startsAt));
  const end = fmt.format(new Date(endsAt));
  if (start === end) return start;
  return `${start} – ${end}`;
}

export function eventStyles(kind: ScheduleEvent["kind"]): string {
  switch (kind) {
    case "slot_available":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "slot_booked":
      return "border-indigo-200 bg-indigo-50 text-indigo-900";
    default:
      return "border-slate-200 bg-white text-slate-900 shadow-sm";
  }
}

export function eventKindLabel(kind: ScheduleEvent["kind"]): string {
  switch (kind) {
    case "slot_available":
      return "Disponible";
    case "slot_booked":
      return "Réservé";
    default:
      return "Cours";
  }
}
