import { Button } from "@gadz-connect/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AdminTransactionRow } from "@/features/admin/types";
import {
  useAdminBudgets,
  useAdminCampuses,
  useAdminMe,
  useAdminTransactions,
} from "@/features/admin/useAdmin";
import { AdminInvoicesHub } from "@/features/billing/AdminInvoicesHub";
import { AdminBudgetCampusBreakdown } from "@/features/admin/budgets/AdminBudgetCampusBreakdown";
import { AdminBudgetFilters } from "@/features/admin/budgets/AdminBudgetFilters";
import { AdminBudgetHeader } from "@/features/admin/budgets/AdminBudgetHeader";
import { AdminBudgetKpiStrip } from "@/features/admin/budgets/AdminBudgetKpiStrip";
import { AdminBudgetSkeleton } from "@/features/admin/budgets/AdminBudgetSkeleton";
import { AdminBudgetStatusBreakdown } from "@/features/admin/budgets/AdminBudgetStatusBreakdown";
import { AdminBudgetTransactionDrawer } from "@/features/admin/budgets/AdminBudgetTransactionDrawer";
import { AdminBudgetTransactionsTable } from "@/features/admin/budgets/AdminBudgetTransactionsTable";
import {
  filtersFromSearchParams,
  filtersToBudgetApiParams,
  filtersToQueryParams,
  filtersToTransactionsApiParams,
  type BudgetFiltersState,
} from "@/features/admin/budgets/budgetFilters";

const PAGE_SIZE = 50;

export function AdminBudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransactionRow | null>(null);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    setPage(1);
  }, [
    filters.period,
    filters.campusId,
    filters.statusStripe,
    filters.statusUrssaf,
    filters.search,
  ]);

  const { data: me } = useAdminMe();
  const { data: campuses = [] } = useAdminCampuses();
  const budgetParams = useMemo(
    () => filtersToBudgetApiParams(filters),
    [filters],
  );
  const transactionParams = useMemo(
    () => filtersToTransactionsApiParams(filters, page, PAGE_SIZE),
    [filters, page],
  );

  const {
    data: budget,
    isLoading: budgetLoading,
    isError: budgetError,
    error: budgetErrorObj,
    refetch: refetchBudget,
  } = useAdminBudgets(budgetParams);
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
    error: transactionsErrorObj,
    refetch: refetchTransactions,
  } = useAdminTransactions(transactionParams);

  const showCampusFilter = me?.role === "admin_general";
  const transactions = transactionsData?.transactions ?? [];
  const meta = transactionsData?.meta;

  const updateFilters = useCallback(
    (next: BudgetFiltersState) => {
      setPage(1);
      setSearchParams(filtersToQueryParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handleStatusFilter = useCallback(
    (key: "statusStripe" | "statusUrssaf", value: string) => {
      const current =
        key === "statusStripe" ? filters.statusStripe : filters.statusUrssaf;
      const nextValue = current === value ? "all" : value;
      updateFilters({
        ...filters,
        [key]: nextValue,
      } as BudgetFiltersState);
    },
    [filters, updateFilters],
  );

  const clearStatusFilters = useCallback(() => {
    updateFilters({
      ...filters,
      statusStripe: "all",
      statusUrssaf: "all",
    });
  }, [filters, updateFilters]);

  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.pageSize))
    : 1;

  if (budgetLoading) {
    return <AdminBudgetSkeleton />;
  }

  if (budgetError || !budget) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-ink-900">Budgets & transactions</h2>
        <p className="text-sm text-danger">
          {(budgetErrorObj as Error)?.message ??
            "Impossible de charger les budgets"}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void refetchBudget()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBudgetHeader budget={budget} />

      <AdminBudgetKpiStrip budget={budget} />

      <AdminInvoicesHub filters={filters} />

      <AdminBudgetFilters
        filters={filters}
        campuses={campuses}
        showCampusFilter={showCampusFilter}
        displayedCount={transactions.length}
        totalCount={meta?.total ?? 0}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <AdminBudgetStatusBreakdown
        byStripeStatus={budget.byStripeStatus}
        byUrssafStatus={budget.byUrssafStatus}
        filters={filters}
        onFilter={handleStatusFilter}
        onClearFilters={clearStatusFilters}
      />

      {budget.byCampus && budget.byCampus.length > 0 ? (
        <AdminBudgetCampusBreakdown rows={budget.byCampus} />
      ) : null}

      <AdminBudgetTransactionsTable
        transactions={transactions}
        isLoading={transactionsLoading}
        isError={transactionsError}
        errorMessage={(transactionsErrorObj as Error)?.message}
        onOpenTransaction={setSelectedTransaction}
      />

      {meta && meta.total > meta.pageSize ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-ink-600">
            Page {meta.page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      {transactionsError ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refetchTransactions()}
          >
            Recharger les transactions
          </Button>
        </div>
      ) : null}

      <AdminBudgetTransactionDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
