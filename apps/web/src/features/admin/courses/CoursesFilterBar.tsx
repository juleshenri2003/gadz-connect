import { Button, cn } from "@gadz-connect/ui";
import { COURSE_VISUAL_META } from "@/features/scheduling/calendar-utils";
import {
  getActiveFilterLabel,
  STATUS_FILTER_OPTIONS,
  type CourseFiltersState,
  type CourseStatusFilter,
} from "./courseFilters";

interface CoursesFilterBarProps {
  filters: CourseFiltersState;
  campuses: Array<{ id: string; name: string }>;
  showCampusFilter: boolean;
  onChange: (filters: CourseFiltersState) => void;
  onReset: () => void;
  displayedCount: number;
  totalCount: number;
}

export function CoursesFilterBar({
  filters,
  campuses,
  showCampusFilter,
  onChange,
  onReset,
  displayedCount,
  totalCount,
}: CoursesFilterBarProps) {
  const activeLabel = getActiveFilterLabel(filters);

  function toggleStatus(status: CourseStatusFilter) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, preset: null, statuses: next });
  }

  return (
    <div className="space-y-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-xs font-medium text-ink-600">Recherche</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Titre, matière, prof, élève…"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value, preset: null })
            }
          />
        </label>

        {showCampusFilter ? (
          <label className="space-y-1">
            <span className="text-xs font-medium text-ink-600">Campus</span>
            <select
              value={filters.campusId}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-44"
              onChange={(event) =>
                onChange({
                  ...filters,
                  campusId: event.target.value,
                  preset: null,
                })
              }
            >
              <option value="all">Tous les campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Du</span>
          <input
            type="date"
            value={filters.from}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
            onChange={(event) =>
              onChange({ ...filters, from: event.target.value, preset: null })
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Au</span>
          <input
            type="date"
            value={filters.to}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
            onChange={(event) =>
              onChange({ ...filters, to: event.target.value, preset: null })
            }
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((option) => {
          const active = filters.statuses.includes(option.value);
          const meta = COURSE_VISUAL_META[option.category];
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleStatus(option.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                active
                  ? `${meta.classes} ring-2 ring-offset-1`
                  : "border-line bg-surface text-ink-600 hover:border-line",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink-600">
          {displayedCount} affiché{displayedCount > 1 ? "s" : ""} sur{" "}
          {totalCount}
          {activeLabel ? (
            <span className="ml-2 text-ink-400">· {activeLabel}</span>
          ) : null}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );
}
