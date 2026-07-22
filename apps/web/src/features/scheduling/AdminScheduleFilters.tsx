import { Button, cn } from "@gadz-connect/ui";
import {
  COURSE_VISUAL_META,
  type CourseVisualCategory,
} from "@/features/scheduling/calendar-utils";
import type { AdminScheduleStatusFilter } from "@/features/scheduling/adminScheduleUtils";

const STATUS_OPTIONS: Array<{
  value: AdminScheduleStatusFilter;
  label: string;
  category: CourseVisualCategory;
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

interface AdminScheduleFiltersProps {
  campuses: Array<{ id: string; name: string }>;
  campusId?: string;
  search: string;
  selectedStatus: AdminScheduleStatusFilter[];
  showHistory: boolean;
  showCampusFilter: boolean;
  focusActive?: boolean;
  focusMatchCount?: number;
  onCampusChange: (campusId: string | undefined) => void;
  onSearchChange: (value: string) => void;
  onStatusToggle: (status: AdminScheduleStatusFilter) => void;
  onShowHistoryChange: (value: boolean) => void;
  onExport?: () => void;
  exporting?: boolean;
}

export function AdminScheduleFilters({
  campuses,
  campusId,
  search,
  selectedStatus,
  showHistory,
  showCampusFilter,
  focusActive,
  focusMatchCount,
  onCampusChange,
  onSearchChange,
  onStatusToggle,
  onShowHistoryChange,
  onExport,
  exporting,
}: AdminScheduleFiltersProps) {
  return (
    <div className="space-y-4 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-4">
        {showCampusFilter ? (
          <div className="min-w-[10rem] flex-1">
            <label
              htmlFor="admin-planning-campus"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400"
            >
              Campus
            </label>
            <select
              id="admin-planning-campus"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              value={campusId ?? ""}
              onChange={(e) => onCampusChange(e.target.value || undefined)}
            >
              <option value="">Tous les campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="min-w-[12rem] flex-[2]">
          <label
            htmlFor="admin-planning-search"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400"
          >
            Personne (prof ou élève)
          </label>
          <input
            id="admin-planning-search"
            type="search"
            placeholder="Ex. Martin — les autres cours s’estompent…"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {focusActive ? (
            <p className="mt-1 text-xs text-ink-500">
              Focus actif
              {focusMatchCount != null
                ? ` — ${focusMatchCount} session${focusMatchCount > 1 ? "s" : ""} mise${focusMatchCount > 1 ? "s" : ""} en avant`
                : ""}
              . Les autres restent visibles en fond.
            </p>
          ) : null}
        </div>

        {onExport ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? "Export…" : "Exporter CSV"}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Statut
        </span>
        {STATUS_OPTIONS.map((option) => {
          const active = selectedStatus.includes(option.value);
          const meta = COURSE_VISUAL_META[option.category];
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                active
                  ? `${meta.classes} ring-2 ring-offset-1`
                  : "border-line bg-surface text-ink-600 hover:border-line",
              )}
              onClick={() => onStatusToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
        <input
          type="checkbox"
          className="rounded border-line"
          checked={showHistory}
          onChange={(e) => onShowHistoryChange(e.target.checked)}
        />
        Afficher tous les cours (passés, terminés, annulés)
      </label>
    </div>
  );
}
