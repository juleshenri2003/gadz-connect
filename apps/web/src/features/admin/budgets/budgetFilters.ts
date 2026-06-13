import type {
  TransactionStripeStatus,
  TransactionUrssafStatus,
} from "@gadz-connect/types";
import type {
  AdminBudgetPeriod,
  AdminBudgetQueryParams,
  AdminTransactionsQueryParams,
} from "@/features/admin/types";

export interface BudgetFiltersState {
  period: AdminBudgetPeriod;
  campusId: string;
  statusStripe: TransactionStripeStatus | "all";
  statusUrssaf: TransactionUrssafStatus | "all";
  search: string;
}

export const DEFAULT_BUDGET_FILTERS: BudgetFiltersState = {
  period: "month",
  campusId: "all",
  statusStripe: "all",
  statusUrssaf: "all",
  search: "",
};

const PERIODS = new Set<AdminBudgetPeriod>(["month", "week", "30d", "all"]);
const STRIPE_STATUSES = new Set<TransactionStripeStatus>([
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);
const URSSAF_STATUSES = new Set<TransactionUrssafStatus>([
  "pending",
  "declared",
]);

export function filtersFromSearchParams(
  params: URLSearchParams,
): BudgetFiltersState {
  const periodRaw = params.get("period") ?? "month";
  const period = PERIODS.has(periodRaw as AdminBudgetPeriod)
    ? (periodRaw as AdminBudgetPeriod)
    : "month";

  const statusStripeRaw = params.get("status_stripe") ?? "all";
  const statusStripe = STRIPE_STATUSES.has(statusStripeRaw as TransactionStripeStatus)
    ? (statusStripeRaw as TransactionStripeStatus)
    : "all";

  const statusUrssafRaw = params.get("status_urssaf") ?? "all";
  const statusUrssaf = URSSAF_STATUSES.has(
    statusUrssafRaw as TransactionUrssafStatus,
  )
    ? (statusUrssafRaw as TransactionUrssafStatus)
    : "all";

  return {
    period,
    campusId: params.get("campus_id") ?? "all",
    statusStripe,
    statusUrssaf,
    search: params.get("search") ?? "",
  };
}

export function filtersToQueryParams(
  filters: BudgetFiltersState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.period !== "month") params.set("period", filters.period);
  if (filters.campusId !== "all") params.set("campus_id", filters.campusId);
  if (filters.statusStripe !== "all") {
    params.set("status_stripe", filters.statusStripe);
  }
  if (filters.statusUrssaf !== "all") {
    params.set("status_urssaf", filters.statusUrssaf);
  }
  if (filters.search.trim()) params.set("search", filters.search.trim());
  return params;
}

export function filtersToBudgetApiParams(
  filters: BudgetFiltersState,
): AdminBudgetQueryParams {
  return {
    period: filters.period,
    campus_id: filters.campusId !== "all" ? filters.campusId : undefined,
  };
}

export function filtersToTransactionsApiParams(
  filters: BudgetFiltersState,
  page: number,
  pageSize = 50,
): AdminTransactionsQueryParams {
  return {
    ...filtersToBudgetApiParams(filters),
    status_stripe:
      filters.statusStripe !== "all" ? filters.statusStripe : undefined,
    status_urssaf:
      filters.statusUrssaf !== "all" ? filters.statusUrssaf : undefined,
    search: filters.search.trim() || undefined,
    page,
    limit: pageSize,
  };
}
