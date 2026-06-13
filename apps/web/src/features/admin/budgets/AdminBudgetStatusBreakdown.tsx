import type { ReactNode } from "react";
import { formatEuro } from "@/features/admin/format";
import type { AdminStatusAggregate } from "@/features/admin/types";
import {
  StripeStatusBadge,
  UrssafStatusBadge,
} from "./AdminBudgetStatusBadges";
import { STRIPE_STATUS_LABELS, URSSAF_STATUS_LABELS } from "./adminBudgetLabels";
import type { BudgetFiltersState } from "./budgetFilters";

interface StatusTableProps {
  title: string;
  labels: Record<string, string>;
  data: Record<string, AdminStatusAggregate>;
  filterKey: "statusStripe" | "statusUrssaf";
  activeFilter: BudgetFiltersState;
  onFilter: (key: "statusStripe" | "statusUrssaf", value: string) => void;
  renderBadge: (status: string) => ReactNode;
}

function StatusTable({
  title,
  labels,
  data,
  filterKey,
  activeFilter,
  onFilter,
  renderBadge,
}: StatusTableProps) {
  const entries = Object.entries(data).sort(([a], [b]) =>
    a.localeCompare(b, "fr"),
  );
  const activeValue =
    filterKey === "statusStripe"
      ? activeFilter.statusStripe
      : activeFilter.statusUrssaf;

  return (
    <div>
      <h4 className="text-sm font-medium text-ink-900">{title}</h4>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Aucune transaction sur la période.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map(([status, aggregate]) => {
            const isActive = activeValue === status;
            return (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => onFilter(filterKey, status)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border-brand-100 bg-brand-50"
                      : "border-line bg-paper hover:border-line"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {renderBadge(status)}
                    <span className="text-ink-600">
                      {labels[status as keyof typeof labels] ?? status}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium tabular-nums text-ink-900">
                      {aggregate.count}
                    </span>
                    <span className="block text-xs tabular-nums text-ink-400">
                      {formatEuro(aggregate.amountNet)} net
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface AdminBudgetStatusBreakdownProps {
  byStripeStatus: Record<string, AdminStatusAggregate>;
  byUrssafStatus: Record<string, AdminStatusAggregate>;
  filters: BudgetFiltersState;
  onFilter: (key: "statusStripe" | "statusUrssaf", value: string) => void;
  onClearFilters: () => void;
}

export function AdminBudgetStatusBreakdown({
  byStripeStatus,
  byUrssafStatus,
  filters,
  onFilter,
  onClearFilters,
}: AdminBudgetStatusBreakdownProps) {
  const hasActiveStatusFilter =
    filters.statusStripe !== "all" || filters.statusUrssaf !== "all";

  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Répartition par statut</h3>
          <p className="mt-1 text-xs text-ink-400">
            Cliquez sur une ligne pour filtrer la liste des transactions
          </p>
        </div>
        {hasActiveStatusFilter ? (
          <button
            type="button"
            className="text-xs font-medium text-brand-700 hover:underline"
            onClick={onClearFilters}
          >
            Effacer les filtres statut
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <StatusTable
          title="Stripe"
          labels={STRIPE_STATUS_LABELS}
          data={byStripeStatus}
          filterKey="statusStripe"
          activeFilter={filters}
          onFilter={onFilter}
          renderBadge={(status) => (
            <StripeStatusBadge status={status as keyof typeof STRIPE_STATUS_LABELS} />
          )}
        />
        <StatusTable
          title="URSSAF"
          labels={URSSAF_STATUS_LABELS}
          data={byUrssafStatus}
          filterKey="statusUrssaf"
          activeFilter={filters}
          onFilter={onFilter}
          renderBadge={(status) => (
            <UrssafStatusBadge status={status as keyof typeof URSSAF_STATUS_LABELS} />
          )}
        />
      </div>
    </section>
  );
}
