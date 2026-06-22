import type {
  TransactionStripeStatus,
  TransactionUrssafStatus,
} from "@gadz-connect/types";
import { supabaseAdmin } from "./supabase.js";

export type AdminBudgetPeriod = "month" | "week" | "30d" | "all";

export interface AdminBudgetQuery {
  period?: AdminBudgetPeriod;
  campusId?: string;
}

export interface AdminTransactionsQuery extends AdminBudgetQuery {
  statusStripe?: TransactionStripeStatus;
  statusUrssaf?: TransactionUrssafStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StatusAggregate {
  count: number;
  amountGross: number;
  amountNet: number;
}

export interface AdminBudgetTotals {
  volumeBrut: number;
  volumeCommissions: number;
  volumeUrssaf: number;
  volumeNetVerse: number;
  encaisseBrut: number;
  encaisseNet: number;
  enAttenteBrut: number;
  enAttenteNet: number;
  urssafToDeclare: number;
  urssafToDeclareCount: number;
}

export interface AdminBudgetCampusRow {
  campusId: string;
  name: string;
  encaisseNet: number;
  enAttenteBrut: number;
  commission: number;
  transactionCount: number;
}

export interface AdminBudgetResponse {
  scope: "campus" | "global";
  period: AdminBudgetPeriod;
  periodLabel: string;
  budgets: AdminBudgetTotals;
  allTime: Pick<
    AdminBudgetTotals,
    | "volumeBrut"
    | "encaisseNet"
    | "encaisseBrut"
    | "volumeCommissions"
    | "volumeUrssaf"
  >;
  byStripeStatus: Record<string, StatusAggregate>;
  byUrssafStatus: Record<string, StatusAggregate>;
  transactionsTotal: number;
  byCampus?: AdminBudgetCampusRow[];
}

export interface AdminTransactionCourse {
  id: string;
  title: string;
  subject: string | null;
  scheduled_at: string | null;
  campus: { id: string; name: string } | null;
  provider: { first_name: string; last_name: string } | null;
  client: { first_name: string; last_name: string } | null;
}

export interface AdminTransactionRow {
  id: string;
  amount_gross: number;
  commission_sasu: number;
  taxes_urssaf: number;
  net_payout: number;
  status_stripe: TransactionStripeStatus;
  status_urssaf: TransactionUrssafStatus;
  created_at: string;
  course: AdminTransactionCourse;
  invoice_summary?: {
    invoice_count: number;
    parent_email_sent: boolean;
  };
}

export interface AdminTransactionsMeta {
  total: number;
  page: number;
  pageSize: number;
}

interface RawTransactionRow {
  id: string;
  amount_gross: unknown;
  commission_sasu: unknown;
  taxes_urssaf: unknown;
  net_payout: unknown;
  status_stripe: string;
  status_urssaf: string;
  created_at: string;
  course_id: string;
  course: unknown;
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function emptyTotals(): AdminBudgetTotals {
  return {
    volumeBrut: 0,
    volumeCommissions: 0,
    volumeUrssaf: 0,
    volumeNetVerse: 0,
    encaisseBrut: 0,
    encaisseNet: 0,
    enAttenteBrut: 0,
    enAttenteNet: 0,
    urssafToDeclare: 0,
    urssafToDeclareCount: 0,
  };
}

function emptyStatusAggregate(): StatusAggregate {
  return { count: 0, amountGross: 0, amountNet: 0 };
}

export function resolveAdminBudgetCampusId(
  scopeCampusId: string | undefined,
  requestedCampusId?: string,
): string | undefined {
  if (scopeCampusId) return scopeCampusId;
  return requestedCampusId;
}

export function parseAdminBudgetQuery(
  query: Record<string, unknown>,
): AdminBudgetQuery {
  const periodRaw =
    typeof query.period === "string" ? query.period.trim() : "month";
  const period: AdminBudgetPeriod =
    periodRaw === "week" ||
    periodRaw === "30d" ||
    periodRaw === "all" ||
    periodRaw === "month"
      ? periodRaw
      : "month";

  const campusId =
    typeof query.campus_id === "string" && query.campus_id.trim()
      ? query.campus_id.trim()
      : typeof query.campusId === "string" && query.campusId.trim()
        ? query.campusId.trim()
        : undefined;

  return { period, campusId };
}

export function parseAdminTransactionsQuery(
  query: Record<string, unknown>,
): AdminTransactionsQuery {
  const base = parseAdminBudgetQuery(query);
  const statusStripe =
    typeof query.status_stripe === "string" &&
    ["pending", "succeeded", "failed", "refunded"].includes(query.status_stripe)
      ? (query.status_stripe as TransactionStripeStatus)
      : undefined;
  const statusUrssaf =
    typeof query.status_urssaf === "string" &&
    ["pending", "declared"].includes(query.status_urssaf)
      ? (query.status_urssaf as TransactionUrssafStatus)
      : undefined;
  const search =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim().toLowerCase()
      : undefined;
  const page = Math.max(
    1,
    typeof query.page === "string"
      ? Number.parseInt(query.page, 10) || 1
      : typeof query.page === "number"
        ? query.page
        : 1,
  );
  const limit = Math.min(
    100,
    Math.max(
      1,
      typeof query.limit === "string"
        ? Number.parseInt(query.limit, 10) || 50
        : typeof query.limit === "number"
          ? query.limit
          : 50,
    ),
  );

  return {
    ...base,
    statusStripe,
    statusUrssaf,
    search,
    page,
    limit,
  };
}

export function getPeriodBounds(
  period: AdminBudgetPeriod,
  now = new Date(),
): { start: Date | null; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "all") {
    return { start: null, end };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "month") {
    start.setDate(1);
  } else if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
  } else if (period === "30d") {
    start.setDate(start.getDate() - 29);
  }

  return { start, end };
}

export function getPeriodLabel(period: AdminBudgetPeriod): string {
  switch (period) {
    case "month":
      return "Mois en cours";
    case "week":
      return "Semaine en cours";
    case "30d":
      return "30 derniers jours";
    case "all":
      return "Tout l'historique";
  }
}

function isInPeriod(
  iso: string,
  start: Date | null,
  end: Date,
): boolean {
  if (!start) return true;
  const date = new Date(iso);
  return date >= start && date <= end;
}

function addToStatusAggregate(
  map: Record<string, StatusAggregate>,
  key: string,
  gross: number,
  net: number,
): void {
  if (!map[key]) {
    map[key] = emptyStatusAggregate();
  }
  map[key].count += 1;
  map[key].amountGross += gross;
  map[key].amountNet += net;
}

function roundTotals(totals: AdminBudgetTotals): AdminBudgetTotals {
  return {
    volumeBrut: round2(totals.volumeBrut),
    volumeCommissions: round2(totals.volumeCommissions),
    volumeUrssaf: round2(totals.volumeUrssaf),
    volumeNetVerse: round2(totals.volumeNetVerse),
    encaisseBrut: round2(totals.encaisseBrut),
    encaisseNet: round2(totals.encaisseNet),
    enAttenteBrut: round2(totals.enAttenteBrut),
    enAttenteNet: round2(totals.enAttenteNet),
    urssafToDeclare: round2(totals.urssafToDeclare),
    urssafToDeclareCount: totals.urssafToDeclareCount,
  };
}

function roundStatusMap(
  map: Record<string, StatusAggregate>,
): Record<string, StatusAggregate> {
  const result: Record<string, StatusAggregate> = {};
  for (const [key, value] of Object.entries(map)) {
    result[key] = {
      count: value.count,
      amountGross: round2(value.amountGross),
      amountNet: round2(value.amountNet),
    };
  }
  return result;
}

function accumulateTransaction(
  totals: AdminBudgetTotals,
  gross: number,
  commission: number,
  urssaf: number,
  net: number,
  stripeStatus: string,
  urssafStatus: string,
): void {
  totals.volumeBrut += gross;
  totals.volumeCommissions += commission;
  totals.volumeUrssaf += urssaf;
  totals.volumeNetVerse += net;

  if (stripeStatus === "succeeded") {
    totals.encaisseBrut += gross;
    totals.encaisseNet += net;
    if (urssafStatus === "pending") {
      totals.urssafToDeclare += net;
      totals.urssafToDeclareCount += 1;
    }
  } else if (stripeStatus === "pending") {
    totals.enAttenteBrut += gross;
    totals.enAttenteNet += net;
  }
}

function mapRawTransaction(row: RawTransactionRow): AdminTransactionRow | null {
  const courseRaw = pickOne<{
    id: string;
    title: string;
    subject: string | null;
    scheduled_at: string | null;
    campus: unknown;
    provider: unknown;
    client: unknown;
  }>(row.course);

  if (!courseRaw) return null;

  const campus = pickOne<{ id: string; name: string }>(courseRaw.campus);
  const provider = pickOne<{ first_name: string; last_name: string }>(
    courseRaw.provider,
  );
  const client = pickOne<{ first_name: string; last_name: string }>(
    courseRaw.client,
  );

  return {
    id: row.id,
    amount_gross: parseAmount(row.amount_gross),
    commission_sasu: parseAmount(row.commission_sasu),
    taxes_urssaf: parseAmount(row.taxes_urssaf),
    net_payout: parseAmount(row.net_payout),
    status_stripe: row.status_stripe as TransactionStripeStatus,
    status_urssaf: row.status_urssaf as TransactionUrssafStatus,
    created_at: row.created_at,
    course: {
      id: courseRaw.id,
      title: courseRaw.title,
      subject: courseRaw.subject,
      scheduled_at: courseRaw.scheduled_at,
      campus,
      provider,
      client,
    },
  };
}

const TRANSACTION_SELECT = `
  id, amount_gross, commission_sasu, taxes_urssaf, net_payout,
  status_stripe, status_urssaf, created_at, course_id,
  course:course_id (
    id, title, subject, scheduled_at, campus_id,
    campus:campus_id ( id, name ),
    provider:provider_id ( first_name, last_name ),
    client:client_id ( first_name, last_name )
  )
`;

async function fetchCourseIdsForCampus(campusId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select("id")
    .eq("campus_id", campusId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id as string);
}

async function fetchRawTransactions(
  campusId?: string,
): Promise<RawTransactionRow[]> {
  let query = supabaseAdmin
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("created_at", { ascending: false });

  if (campusId) {
    const courseIds = await fetchCourseIdsForCampus(campusId);
    if (courseIds.length === 0) return [];
    query = query.in("course_id", courseIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RawTransactionRow[];
}

export function aggregateAdminBudget(
  rows: RawTransactionRow[],
  period: AdminBudgetPeriod,
  includeByCampus: boolean,
  now = new Date(),
): Omit<AdminBudgetResponse, "scope"> {
  const { start, end } = getPeriodBounds(period, now);
  const periodTotals = emptyTotals();
  const allTimeTotals = emptyTotals();
  const byStripeStatus: Record<string, StatusAggregate> = {};
  const byUrssafStatus: Record<string, StatusAggregate> = {};
  const campusMap = new Map<
    string,
    {
      campusId: string;
      name: string;
      encaisseNet: number;
      enAttenteBrut: number;
      commission: number;
      transactionCount: number;
    }
  >();

  let periodCount = 0;

  for (const row of rows) {
    const gross = parseAmount(row.amount_gross);
    const commission = parseAmount(row.commission_sasu);
    const urssaf = parseAmount(row.taxes_urssaf);
    const net = parseAmount(row.net_payout);
    const stripeStatus = row.status_stripe;
    const urssafStatus = row.status_urssaf;
    const inPeriod = isInPeriod(row.created_at, start, end);

    accumulateTransaction(
      allTimeTotals,
      gross,
      commission,
      urssaf,
      net,
      stripeStatus,
      urssafStatus,
    );

    if (!inPeriod) continue;

    periodCount += 1;
    accumulateTransaction(
      periodTotals,
      gross,
      commission,
      urssaf,
      net,
      stripeStatus,
      urssafStatus,
    );

    addToStatusAggregate(byStripeStatus, stripeStatus, gross, net);
    addToStatusAggregate(byUrssafStatus, urssafStatus, gross, net);

    if (includeByCampus) {
      const course = pickOne<{ campus: unknown }>(row.course);
      const campus = pickOne<{ id: string; name: string }>(course?.campus);
      if (campus) {
        if (!campusMap.has(campus.id)) {
          campusMap.set(campus.id, {
            campusId: campus.id,
            name: campus.name,
            encaisseNet: 0,
            enAttenteBrut: 0,
            commission: 0,
            transactionCount: 0,
          });
        }
        const campusRow = campusMap.get(campus.id)!;
        campusRow.transactionCount += 1;
        campusRow.commission += commission;
        if (stripeStatus === "succeeded") {
          campusRow.encaisseNet += net;
        } else if (stripeStatus === "pending") {
          campusRow.enAttenteBrut += gross;
        }
      }
    }
  }

  const byCampus = includeByCampus
    ? [...campusMap.values()]
        .map((row) => ({
          campusId: row.campusId,
          name: row.name,
          encaisseNet: round2(row.encaisseNet),
          enAttenteBrut: round2(row.enAttenteBrut),
          commission: round2(row.commission),
          transactionCount: row.transactionCount,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    : undefined;

  return {
    period,
    periodLabel: getPeriodLabel(period),
    budgets: roundTotals(periodTotals),
    allTime: {
      volumeBrut: round2(allTimeTotals.volumeBrut),
      encaisseNet: round2(allTimeTotals.encaisseNet),
      encaisseBrut: round2(allTimeTotals.encaisseBrut),
      volumeCommissions: round2(allTimeTotals.volumeCommissions),
      volumeUrssaf: round2(allTimeTotals.volumeUrssaf),
    },
    byStripeStatus: roundStatusMap(byStripeStatus),
    byUrssafStatus: roundStatusMap(byUrssafStatus),
    transactionsTotal: periodCount,
    ...(byCampus ? { byCampus } : {}),
  };
}

export async function fetchAdminBudgets(
  scopeCampusId: string | undefined,
  params: AdminBudgetQuery,
): Promise<AdminBudgetResponse> {
  const period = params.period ?? "month";
  const effectiveCampusId = resolveAdminBudgetCampusId(
    scopeCampusId,
    params.campusId,
  );
  const includeByCampus = !scopeCampusId && !params.campusId;

  const rows = await fetchRawTransactions(effectiveCampusId);
  const aggregated = aggregateAdminBudget(rows, period, includeByCampus);

  return {
    scope: scopeCampusId || params.campusId ? "campus" : "global",
    ...aggregated,
  };
}

function matchesSearch(row: AdminTransactionRow, search: string): boolean {
  const parts = [
    row.course.title,
    row.course.subject ?? "",
    row.course.provider
      ? `${row.course.provider.first_name} ${row.course.provider.last_name}`
      : "",
    row.course.client
      ? `${row.course.client.first_name} ${row.course.client.last_name}`
      : "",
    row.course.campus?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return parts.includes(search);
}

export async function fetchAdminTransactions(
  scopeCampusId: string | undefined,
  params: AdminTransactionsQuery,
): Promise<{ transactions: AdminTransactionRow[]; meta: AdminTransactionsMeta }> {
  const period = params.period ?? "month";
  const effectiveCampusId = resolveAdminBudgetCampusId(
    scopeCampusId,
    params.campusId,
  );
  const { start, end } = getPeriodBounds(period);
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;

  const rawRows = await fetchRawTransactions(effectiveCampusId);

  let mapped = rawRows
    .map(mapRawTransaction)
    .filter((row): row is AdminTransactionRow => row !== null)
    .filter((row) => isInPeriod(row.created_at, start, end));

  if (params.statusStripe) {
    mapped = mapped.filter((row) => row.status_stripe === params.statusStripe);
  }
  if (params.statusUrssaf) {
    mapped = mapped.filter((row) => row.status_urssaf === params.statusUrssaf);
  }
  if (params.search) {
    mapped = mapped.filter((row) => matchesSearch(row, params.search!));
  }

  const total = mapped.length;
  const offset = (page - 1) * limit;
  let transactions = mapped.slice(offset, offset + limit);

  const { fetchInvoiceSummariesForTransactions } = await import(
    "./billing/admin-invoices.js"
  );
  const summaries = await fetchInvoiceSummariesForTransactions(
    transactions.map((tx) => tx.id),
  );
  transactions = transactions.map((tx) => {
    const summary = summaries.get(tx.id);
    if (!summary || summary.invoice_count === 0) return tx;
    return { ...tx, invoice_summary: summary };
  });

  return {
    transactions,
    meta: { total, page, pageSize: limit },
  };
}
