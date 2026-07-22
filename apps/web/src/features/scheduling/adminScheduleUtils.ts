import {
  addDays,
  eventsForDay,
  isSameDay,
  startOfWeek,
} from "./calendar-utils";
import type { ScheduleEvent } from "./types";

export type AdminScheduleViewMode = "week" | "list" | "month";

export type AdminScheduleStatusFilter =
  | "pending"
  | "awaiting_data"
  | "completed"
  | "replaced"
  | "cancelled"
  /** Anciens paramètres URL (compat). */
  | "scheduled";

/** Mappe les chips UI vers les statuts API. */
export const STATUS_FILTER_TO_API: Record<
  AdminScheduleStatusFilter,
  string[]
> = {
  pending: ["scheduled", "payment_pending"],
  awaiting_data: ["awaiting_session_confirmation"],
  completed: ["completed"],
  replaced: ["awaiting_replacement"],
  cancelled: ["cancelled"],
  scheduled: ["scheduled", "payment_pending"],
};

const KNOWN_STATUS_FILTERS = new Set<string>([
  "pending",
  "awaiting_data",
  "completed",
  "replaced",
  "cancelled",
  "scheduled",
]);

export function expandStatusFiltersToApi(
  selected: AdminScheduleStatusFilter[],
): string[] | undefined {
  if (selected.length === 0) return undefined;
  const expanded = new Set<string>();
  for (const filter of selected) {
    for (const status of STATUS_FILTER_TO_API[filter] ?? [filter]) {
      expanded.add(status);
    }
  }
  return [...expanded];
}

export interface AdminScheduleUrlState {
  week?: string;
  campusId?: string;
  status?: AdminScheduleStatusFilter[];
  search?: string;
  showHistory?: boolean;
  view?: AdminScheduleViewMode;
  month?: string;
}

export function parseMonthParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}-01T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export { formatWeekParam, parseWeekParam } from "./calendar-utils";

export function formatMonthParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getMonthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function formatMonthLabel(anchor: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(anchor);
}

export interface DaySummary {
  total: number;
  cancelled: number;
}

export function summarizeDayEvents(events: ScheduleEvent[], day: Date): DaySummary {
  const dayEvents = eventsForDay(events, day);
  return {
    total: dayEvents.length,
    cancelled: dayEvents.filter((e) => e.status === "cancelled").length,
  };
}

export function groupEventsByDay(
  events: ScheduleEvent[],
): Array<{ day: Date; events: ScheduleEvent[] }> {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const groups: Array<{ day: Date; events: ScheduleEvent[] }> = [];

  for (const event of sorted) {
    const eventDay = new Date(event.startsAt);
    eventDay.setHours(0, 0, 0, 0);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, eventDay)) {
      last.events.push(event);
    } else {
      groups.push({ day: eventDay, events: [event] });
    }
  }

  return groups;
}

export function buildAdminUsersHref(name?: string): string {
  if (!name?.trim()) return "/admin/utilisateurs";
  return `/admin/utilisateurs?search=${encodeURIComponent(name.trim())}`;
}

/** @deprecated Utiliser buildAdminUsersHref */
export const buildAdminMembersHref = buildAdminUsersHref;

export function buildAdminPlanningHref(
  params: Partial<AdminScheduleUrlState>,
): string {
  const search = new URLSearchParams();
  if (params.week) search.set("week", params.week);
  if (params.month) search.set("month", params.month);
  if (params.campusId) search.set("campus", params.campusId);
  if (params.status?.length) search.set("status", params.status.join(","));
  if (params.search) search.set("q", params.search);
  if (params.showHistory === false) search.set("history", "0");
  else if (params.showHistory) search.delete("history");
  if (params.view && params.view !== "week") search.set("view", params.view);
  const qs = search.toString();
  return qs ? `/admin/planning?${qs}` : "/admin/planning";
}

export function buildAdminAlertHref(notificationId?: string): string {
  if (!notificationId) return "/admin/alertes";
  return `/admin/alertes?nid=${encodeURIComponent(notificationId)}`;
}

export function parseAdminScheduleUrl(
  searchParams: URLSearchParams,
): AdminScheduleUrlState {
  const statusRaw = searchParams.get("status");
  const viewRaw = searchParams.get("view");
  const historyRaw = searchParams.get("history");
  const status = statusRaw
    ? (statusRaw
        .split(",")
        .filter((value) => KNOWN_STATUS_FILTERS.has(value)) as AdminScheduleStatusFilter[])
    : undefined;

  return {
    week: searchParams.get("week") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    campusId: searchParams.get("campus") ?? undefined,
    status: status?.length ? status : undefined,
    search: searchParams.get("q") ?? undefined,
    // Par défaut : tout afficher. history=0 pour masquer l'historique.
    showHistory: historyRaw !== "0",
    view:
      viewRaw === "list" || viewRaw === "month" || viewRaw === "week"
        ? viewRaw
        : undefined,
  };
}

export function getScheduleRange(
  view: AdminScheduleViewMode,
  weekAnchor: Date,
  monthAnchor: Date,
): { from: string; to: string } {
  if (view === "month") {
    const monthStart = new Date(
      monthAnchor.getFullYear(),
      monthAnchor.getMonth(),
      1,
    );
    const monthEnd = new Date(
      monthAnchor.getFullYear(),
      monthAnchor.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const gridStart = startOfWeek(monthStart);
    const gridEnd = addDays(startOfWeek(monthEnd), 6);
    gridEnd.setHours(23, 59, 59, 999);
    return { from: gridStart.toISOString(), to: gridEnd.toISOString() };
  }

  if (view === "list") {
    const now = new Date();
    const from = addDays(now, -90);
    from.setHours(0, 0, 0, 0);
    const to = addDays(now, 180);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  const weekStart = startOfWeek(weekAnchor);
  const weekEnd = addDays(weekStart, 7);
  return { from: weekStart.toISOString(), to: weekEnd.toISOString() };
}
