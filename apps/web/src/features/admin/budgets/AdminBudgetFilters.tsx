import { Button } from "@gadz-connect/ui";
import { PERIOD_LABELS } from "./adminBudgetLabels";
import type { BudgetFiltersState } from "./budgetFilters";

interface AdminBudgetFiltersProps {
  filters: BudgetFiltersState;
  campuses: Array<{ id: string; name: string }>;
  showCampusFilter: boolean;
  displayedCount: number;
  totalCount: number;
  onChange: (filters: BudgetFiltersState) => void;
  onReset: () => void;
}

export function AdminBudgetFilters({
  filters,
  campuses,
  showCampusFilter,
  displayedCount,
  totalCount,
  onChange,
  onReset,
}: AdminBudgetFiltersProps) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-xs font-medium text-ink-600">Recherche</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Cours, prof, élève, campus…"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Période</span>
          <select
            value={filters.period}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-44"
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

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Statut Stripe</span>
          <select
            value={filters.statusStripe}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
            onChange={(event) =>
              onChange({
                ...filters,
                statusStripe: event.target.value as BudgetFiltersState["statusStripe"],
              })
            }
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="succeeded">Encaissé</option>
            <option value="failed">Échoué</option>
            <option value="refunded">Remboursé</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Statut URSSAF</span>
          <select
            value={filters.statusUrssaf}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
            onChange={(event) =>
              onChange({
                ...filters,
                statusUrssaf: event.target.value as BudgetFiltersState["statusUrssaf"],
              })
            }
          >
            <option value="all">Tous</option>
            <option value="pending">À déclarer</option>
            <option value="declared">Déclaré</option>
          </select>
        </label>

        {showCampusFilter ? (
          <label className="space-y-1">
            <span className="text-xs font-medium text-ink-600">Campus</span>
            <select
              value={filters.campusId}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
              onChange={(event) =>
                onChange({ ...filters, campusId: event.target.value })
              }
            >
              <option value="all">Tous</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-400">
        <p>
          {displayedCount} affichée{displayedCount > 1 ? "s" : ""} sur{" "}
          {totalCount} transaction{totalCount > 1 ? "s" : ""}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );
}
