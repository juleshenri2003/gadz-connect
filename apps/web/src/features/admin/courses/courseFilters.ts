import type { AdminCoursePreset } from "@/features/admin/types";
import {
  expandStatusFiltersToApi,
  type AdminScheduleStatusFilter,
} from "@/features/scheduling/adminScheduleUtils";
import { COURSE_VISUAL_META } from "@/features/scheduling/calendar-utils";

export type CourseStatusFilter = AdminScheduleStatusFilter;

export interface CourseFiltersState {
  search: string;
  campusId: string | "all";
  statuses: CourseStatusFilter[];
  from: string;
  to: string;
  preset: AdminCoursePreset | null;
}

export const PRESET_FILTER_LABELS: Record<AdminCoursePreset, string> = {
  missing_summary: "Comptes-rendus manquants",
  this_week: "Planifiées cette semaine",
  cancelled: "Annulées",
};

export const STATUS_FILTER_OPTIONS: Array<{
  value: CourseStatusFilter;
  label: string;
  category: keyof typeof COURSE_VISUAL_META;
}> = [
  { value: "pending", label: "En attente", category: "pending" },
  {
    value: "awaiting_data",
    label: "Données attendues",
    category: "awaiting_data",
  },
  { value: "completed", label: "Cours donné", category: "completed" },
  { value: "replaced", label: "Remplacé", category: "replaced" },
  { value: "cancelled", label: "Annulé / renoncé", category: "cancelled" },
];

const KNOWN_STATUS = new Set(STATUS_FILTER_OPTIONS.map((o) => o.value));
const LEGACY_STATUS_MAP: Record<string, CourseStatusFilter> = {
  scheduled: "pending",
  payment_pending: "pending",
  awaiting_session_confirmation: "awaiting_data",
  awaiting_replacement: "replaced",
};

export const DEFAULT_COURSE_FILTERS: CourseFiltersState = {
  search: "",
  campusId: "all",
  statuses: [],
  from: "",
  to: "",
  preset: null,
};

export function parseCoursePreset(
  value: string | null,
): AdminCoursePreset | null {
  if (!value) return null;
  if (value in PRESET_FILTER_LABELS) {
    return value as AdminCoursePreset;
  }
  return null;
}

export function filtersToQueryParams(filters: CourseFiltersState) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.campusId !== "all") params.set("campus_id", filters.campusId);
  if (filters.statuses.length > 0) {
    params.set("status", filters.statuses.join(","));
  }
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.preset) params.set("preset", filters.preset);
  return params;
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): CourseFiltersState {
  const statusRaw = params.get("status");
  const rawStatuses = statusRaw ? statusRaw.split(",").filter(Boolean) : [];
  const statuses = [
    ...new Set(
      rawStatuses.map(
        (s) =>
          (KNOWN_STATUS.has(s as CourseStatusFilter)
            ? s
            : LEGACY_STATUS_MAP[s]) as CourseStatusFilter | undefined,
      ),
    ),
  ].filter((s): s is CourseStatusFilter => Boolean(s));

  return {
    search: params.get("search") ?? "",
    campusId: params.get("campus_id") ?? "all",
    statuses,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    preset: parseCoursePreset(params.get("preset")),
  };
}

export function getActiveFilterLabel(
  filters: CourseFiltersState,
): string | null {
  const parts: string[] = [];
  if (filters.preset) {
    parts.push(PRESET_FILTER_LABELS[filters.preset]);
  }
  if (filters.statuses.length > 0) {
    parts.push(
      filters.statuses
        .map(
          (s) =>
            STATUS_FILTER_OPTIONS.find((o) => o.value === s)?.label ?? s,
        )
        .join(", "),
    );
  }
  if (filters.campusId !== "all") {
    parts.push("Campus filtré");
  }
  if (filters.from || filters.to) {
    parts.push("Période filtrée");
  }
  if (filters.search.trim()) {
    parts.push(`Recherche « ${filters.search.trim()} »`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getEmptyStateMessage(filters: CourseFiltersState): string {
  if (filters.preset === "missing_summary") {
    return "Aucune session passée sans compte-rendu.";
  }
  if (filters.preset === "this_week") {
    return "Aucune session planifiée cette semaine.";
  }
  if (filters.preset === "cancelled") {
    return "Aucun cours annulé.";
  }
  if (
    filters.search.trim() ||
    filters.statuses.length > 0 ||
    filters.from ||
    filters.to ||
    filters.campusId !== "all"
  ) {
    return "Aucune session ne correspond à vos filtres.";
  }
  return "Aucune session enregistrée pour le moment.";
}

export function filtersToApiParams(
  filters: CourseFiltersState,
  page: number,
  pageSize: number,
) {
  const from = filters.from
    ? new Date(`${filters.from}T00:00:00`).toISOString()
    : undefined;
  const to = filters.to
    ? new Date(`${filters.to}T23:59:59.999`).toISOString()
    : undefined;

  const expanded = expandStatusFiltersToApi(filters.statuses);

  return {
    search: filters.search.trim() || undefined,
    status: expanded?.join(","),
    campus_id: filters.campusId !== "all" ? filters.campusId : undefined,
    from,
    to,
    preset: filters.preset ?? undefined,
    page,
    limit: pageSize,
    sort: "scheduled_at_desc" as const,
  };
}
