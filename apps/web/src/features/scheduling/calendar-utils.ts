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

/** Clé `YYYY-MM-DD` en heure locale (évite le décalage UTC de toISOString). */
export function formatWeekParam(date: Date): string {
  const weekStart = startOfWeek(date);
  const y = weekStart.getFullYear();
  const m = String(weekStart.getMonth() + 1).padStart(2, "0");
  const d = String(weekStart.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseWeekParam(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : startOfWeek(parsed);
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
  return events
    .filter((event) => isSameDay(new Date(event.startsAt), day))
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
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

export function formatSessionDurationLabel(
  startsAt: string,
  endsAt: string,
): string | null {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return null;
  const totalMinutes = Math.round(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

export const COURSE_STATUS_LABELS: Record<string, string> = {
  scheduled: "Planifié",
  payment_pending: "Paiement en attente",
  awaiting_session_confirmation: "À confirmer",
  awaiting_replacement: "Remplacement en cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

/** Catégories visuelles emploi du temps (alignées alertes). */
export type CourseVisualCategory =
  | "pending"
  | "awaiting_data"
  | "completed"
  | "replaced"
  | "cancelled"
  | "slot"
  | "other";

export const COURSE_VISUAL_META: Record<
  CourseVisualCategory,
  { label: string; classes: string; swatch: string }
> = {
  pending: {
    label: "En attente",
    classes: "border-brand-100 bg-brand-50 text-brand-800",
    swatch: "border-brand-100 bg-brand-50",
  },
  awaiting_data: {
    label: "Données attendues",
    classes: "border-warning/40 bg-warning-bg text-warning",
    swatch: "border-warning/40 bg-warning-bg",
  },
  completed: {
    label: "Cours donné",
    classes: "border-success/30 bg-success-bg text-success",
    swatch: "border-success/30 bg-success-bg",
  },
  replaced: {
    label: "Remplacé",
    classes: "border-violet-200 bg-violet-100 text-violet-900",
    swatch: "border-violet-200 bg-violet-100",
  },
  cancelled: {
    label: "Annulé / renoncé",
    classes: "border-orange-200 bg-orange-100 text-orange-900 line-through",
    swatch: "border-orange-200 bg-orange-100",
  },
  slot: {
    label: "Créneau libre",
    classes: "border-success/20 bg-success-bg text-success",
    swatch: "border-success/20 bg-success-bg",
  },
  other: {
    label: "Autre",
    classes: "border-line bg-surface text-ink-900 shadow-surface",
    swatch: "border-line bg-surface",
  },
};

export function getCourseVisualCategory(
  kind: ScheduleEvent["kind"],
  status?: string,
  startsAt?: string,
  endsAt?: string,
): CourseVisualCategory {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "awaiting_replacement") return "replaced";
  if (status === "awaiting_session_confirmation") return "awaiting_data";
  if (status === "payment_pending" || status === "scheduled") return "pending";
  if (kind === "slot_available") {
    if (startsAt && isExpiredAvailableSlot(kind, startsAt, endsAt)) {
      return "other";
    }
    return "slot";
  }
  if (kind === "slot_booked") return "pending";
  return "other";
}

export function courseStatusLabel(status?: string): string | undefined {
  if (!status) return undefined;
  return COURSE_STATUS_LABELS[status] ?? status;
}

export function isEventPast(startsAt: string, endsAt?: string): boolean {
  const end = endsAt ?? startsAt;
  return new Date(end).getTime() < Date.now();
}

export function isExpiredAvailableSlot(
  kind: ScheduleEvent["kind"],
  startsAt: string,
  endsAt?: string,
): boolean {
  return kind === "slot_available" && isEventPast(startsAt, endsAt);
}

export function countWeekSummary(
  events: ScheduleEvent[],
  weekDays: Date[],
): { sessions: number; openSlots: number } {
  let sessions = 0;
  let openSlots = 0;

  for (const day of weekDays) {
    for (const event of eventsForDay(events, day)) {
      if (event.kind === "slot_available") {
        if (!isEventPast(event.startsAt, event.endsAt)) openSlots++;
      } else if (event.kind === "course" || event.kind === "slot_booked") {
        sessions++;
      }
    }
  }

  return { sessions, openSlots };
}

export function eventStyles(
  kind: ScheduleEvent["kind"],
  status?: string,
  startsAt?: string,
  endsAt?: string,
): string {
  const category = getCourseVisualCategory(kind, status, startsAt, endsAt);
  if (
    category === "other" &&
    kind === "slot_available" &&
    startsAt &&
    isExpiredAvailableSlot(kind, startsAt, endsAt)
  ) {
    return "border-line bg-paper/80 text-ink-400 opacity-60";
  }
  return COURSE_VISUAL_META[category].classes;
}

export function eventKindLabel(
  kind: ScheduleEvent["kind"],
  status?: string,
): string {
  const category = getCourseVisualCategory(kind, status);
  if (category === "completed") return COURSE_VISUAL_META.completed.label;
  if (category === "cancelled") return COURSE_VISUAL_META.cancelled.label;
  if (category === "replaced") return COURSE_VISUAL_META.replaced.label;
  if (category === "awaiting_data") return COURSE_VISUAL_META.awaiting_data.label;
  if (category === "pending" && (kind === "course" || kind === "slot_booked")) {
    if (status === "payment_pending") return "Paiement en attente";
    return COURSE_VISUAL_META.pending.label;
  }
  switch (kind) {
    case "slot_available":
      return "Disponible";
    case "slot_booked":
      return "Réservé";
    default:
      return "Cours";
  }
}

/** Tri chronologique des événements d'un jour. */
export function sortEventsByStart(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

/** Recherche soft : le nom matche le prof (ou l'élève). */
export function eventMatchesPersonFocus(
  event: ScheduleEvent,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [event.providerName, event.clientName, event.counterpartName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
