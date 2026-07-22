import { Button, cn } from "@gadz-connect/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { AdminTransactionRow } from "@/features/admin/types";
import {
  useAdminBudgets,
  useAdminCampuses,
  useAdminMe,
  useAdminTransactions,
} from "@/features/admin/useAdmin";
import { AdminInvoicesHub } from "@/features/billing/AdminInvoicesHub";
import {
  AdminUrssafReconciliationHub,
  useUrssafAnomaliesCount,
} from "@/features/billing/AdminUrssafReconciliationHub";
import { AdminBudgetCampusBreakdown } from "@/features/admin/budgets/AdminBudgetCampusBreakdown";
import {
  AdminBudgetExceptionsStrip,
  type BudgetExceptionItem,
} from "@/features/admin/budgets/AdminBudgetExceptionsStrip";
import { AdminBudgetFilters } from "@/features/admin/budgets/AdminBudgetFilters";
import { AdminBudgetHeader } from "@/features/admin/budgets/AdminBudgetHeader";
import { AdminBudgetKpiStrip } from "@/features/admin/budgets/AdminBudgetKpiStrip";
import { AdminBudgetPeriodBar } from "@/features/admin/budgets/AdminBudgetPeriodBar";
import { AdminBudgetSkeleton } from "@/features/admin/budgets/AdminBudgetSkeleton";
import { AdminBudgetTransactionDrawer } from "@/features/admin/budgets/AdminBudgetTransactionDrawer";
import { AdminBudgetTransactionsTable } from "@/features/admin/budgets/AdminBudgetTransactionsTable";
import {
  filtersFromSearchParams,
  filtersToBudgetApiParams,
  filtersToQueryParams,
  filtersToTransactionsApiParams,
  type BudgetFiltersState,
  type BudgetWorkspaceTab,
} from "@/features/admin/budgets/budgetFilters";

const PAGE_SIZE = 50;

const TABS: Array<{ id: BudgetWorkspaceTab; label: string; hint: string }> = [
  {
    id: "facturation",
    label: "Facturation",
    hint: "PDF, envois, trous factures",
  },
  {
    id: "cloture",
    label: "Clôture & URSSAF",
    hint: "Pack mois + anomalies avance immédiate",
  },
];

export function AdminBudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [registreOpen, setRegistreOpen] = useState(false);
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
  const { count: urssafAnomaliesCount } = useUrssafAnomaliesCount();

  const budgetParams = useMemo(
    () => filtersToBudgetApiParams(filters),
    [filters],
  );
  const transactionParams = useMemo(
    () => filtersToTransactionsApiParams(filters, page, PAGE_SIZE),
    [filters, page],
  );

  const needTransactions =
    filters.tab === "facturation" || registreOpen;

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
  } = useAdminTransactions(transactionParams, {
    enabled: needTransactions,
  });

  const showCampusFilter = me?.role === "admin_general";
  const transactions = transactionsData?.transactions ?? [];
  const meta = transactionsData?.meta;

  const missingInvoiceHint = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          tx.status_stripe === "succeeded" && tx.invoice_status !== "invoiced",
      ).length,
    [transactions],
  );

  const updateFilters = useCallback(
    (next: BudgetFiltersState) => {
      setPage(1);
      setSearchParams(filtersToQueryParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setPage(1);
    setSearchParams(
      filtersToQueryParams({
        ...filters,
        statusStripe: "all",
        statusUrssaf: "all",
        search: "",
      }),
      { replace: true },
    );
  }, [filters, setSearchParams]);

  const setTab = useCallback(
    (tab: BudgetWorkspaceTab) => {
      updateFilters({ ...filters, tab });
    },
    [filters, updateFilters],
  );

  const handleExceptionSelect = useCallback(
    (item: BudgetExceptionItem) => {
      const next: BudgetFiltersState = {
        ...filters,
        tab: item.tab ?? filters.tab,
        statusStripe: (item.statusStripe as BudgetFiltersState["statusStripe"]) ??
          filters.statusStripe,
      };
      updateFilters(next);
      if (item.statusStripe) {
        setRegistreOpen(true);
      }
    },
    [filters, updateFilters],
  );

  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.pageSize))
    : 1;

  if (budgetLoading) {
    return <AdminBudgetSkeleton />;
  }

  if (budgetError || !budget) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-ink-900">Argent</h2>
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

      <AdminBudgetPeriodBar
        filters={filters}
        campuses={campuses}
        showCampusFilter={showCampusFilter}
        onChange={updateFilters}
      />

      <AdminBudgetKpiStrip budget={budget} />

      <AdminBudgetExceptionsStrip
        budget={budget}
        urssafAnomaliesCount={urssafAnomaliesCount}
        missingInvoiceHint={
          filters.tab === "facturation" ? missingInvoiceHint : 0
        }
        onSelect={handleExceptionSelect}
      />

      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-line bg-paper p-1"
        aria-label="Espaces argent"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            title={tab.hint}
            onClick={() => setTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition",
              filters.tab === tab.id
                ? "bg-surface text-ink-900 shadow-surface"
                : "text-ink-600 hover:text-ink-900",
            )}
            aria-current={filters.tab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {filters.tab === "facturation" ? (
        <AdminInvoicesHub filters={filters} transactions={transactions} />
      ) : (
        <div className="space-y-6">
          <section className="rounded-md border border-line bg-surface p-5">
            <h3 className="font-semibold text-ink-900">Pack clôture</h3>
            <p className="mt-1 text-sm text-ink-600">
              Santé de la période sélectionnée. Exportez le rapprochement URSSAF
              ci-dessous et les ZIP de factures dans l&apos;onglet Facturation.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-line bg-paper px-3 py-2">
                <dt className="text-xs text-ink-500">Encaissé net</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink-900">
                  {formatEuro(budget.budgets.encaisseNet)}
                </dd>
              </div>
              <div className="rounded-md border border-line bg-paper px-3 py-2">
                <dt className="text-xs text-ink-500">Commissions SASU</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink-900">
                  {formatEuro(budget.budgets.volumeCommissions)}
                </dd>
              </div>
              <div className="rounded-md border border-line bg-paper px-3 py-2">
                <dt className="text-xs text-ink-500">URSSAF à déclarer</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink-900">
                  {formatEuro(budget.budgets.urssafToDeclare)}
                </dd>
              </div>
            </dl>
          </section>

          {budget.byCampus && budget.byCampus.length > 0 ? (
            <AdminBudgetCampusBreakdown rows={budget.byCampus} />
          ) : null}

          <AdminUrssafReconciliationHub />
        </div>
      )}

      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper/80"
          onClick={() => setRegistreOpen((open) => !open)}
          aria-expanded={registreOpen}
        >
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Registre des transactions
            </p>
            <p className="text-xs text-ink-500">
              Recherche avancée — masqué par défaut
            </p>
          </div>
          {registreOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-400" />
          )}
        </button>

        {registreOpen ? (
          <div className="space-y-4 border-t border-line p-4">
            <AdminBudgetFilters
              filters={filters}
              campuses={campuses}
              showCampusFilter={showCampusFilter}
              displayedCount={transactions.length}
              totalCount={meta?.total ?? 0}
              onChange={updateFilters}
              onReset={resetFilters}
            />

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
          </div>
        ) : null}
      </section>

      <AdminBudgetTransactionDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
