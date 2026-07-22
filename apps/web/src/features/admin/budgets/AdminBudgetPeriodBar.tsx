import { PERIOD_LABELS } from "./adminBudgetLabels";
import type { BudgetFiltersState } from "./budgetFilters";

interface AdminBudgetPeriodBarProps {
  filters: BudgetFiltersState;
  campuses: Array<{ id: string; name: string }>;
  showCampusFilter: boolean;
  onChange: (filters: BudgetFiltersState) => void;
}

/** Barre légère période + campus pour le cockpit (hors registre). */
export function AdminBudgetPeriodBar({
  filters,
  campuses,
  showCampusFilter,
  onChange,
}: AdminBudgetPeriodBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="space-y-1">
        <span className="text-xs font-medium text-ink-600">Période</span>
        <select
          value={filters.period}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          onChange={(event) =>
            onChange({
              ...filters,
              period: event.target.value as BudgetFiltersState["period"],
            })
          }
        >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {showCampusFilter ? (
        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Campus</span>
          <select
            value={filters.campusId}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            onChange={(event) =>
              onChange({ ...filters, campusId: event.target.value })
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
    </div>
  );
}
