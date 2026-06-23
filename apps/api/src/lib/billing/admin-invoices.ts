import type { AdminBudgetPeriod } from "../admin-budget.js";
import {
  getPeriodBounds,
  resolveAdminBudgetCampusId,
} from "../admin-budget.js";
import { sendParentInvoiceEmail } from "../email/send-parent-invoice.js";
import { sendMonthlyParentInvoiceEmail } from "../email/send-monthly-parent-invoice.js";
import { buildInvoiceDownloadFilename } from "./invoice-filename.js";
import {
  createInvoiceSignedUrl,
  INVOICES_BUCKET,
} from "./invoice-storage.js";
import { supabaseAdmin } from "../supabase.js";

export interface AdminInvoiceRow {
  id: string;
  invoice_type: "parent" | "student";
  invoice_number: string;
  amount: number;
  created_at: string;
  parent_email_sent_at: string | null;
  transaction_id: string;
  course_id: string;
  parent_name: string;
  prof_name: string;
  provider_profile_id: string | null;
  client_profile_id: string | null;
  course_subject: string;
  course_title: string;
  scheduled_at: string | null;
  campus_name: string | null;
  campus_id: string | null;
  download_filename: string;
  is_monthly?: boolean;
  line_count?: number;
}

export interface AdminInvoicesQuery {
  period?: AdminBudgetPeriod;
  campusId?: string;
  invoiceType?: "parent" | "student";
  search?: string;
  emailStatus?: "sent" | "not_sent";
  page?: number;
  limit?: number;
}

export interface AdminInvoicesMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminTransactionInvoiceSummary {
  invoice_count: number;
  parent_email_sent: boolean;
}

type PersonRow = { first_name: string; last_name: string } | null;

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function formatPersonName(person: PersonRow): string {
  if (!person) return "—";
  return `${person.first_name} ${person.last_name}`.trim() || "—";
}

function lastName(person: PersonRow): string {
  return person?.last_name?.trim() ?? "";
}

function extractCampusId(course: unknown): string | undefined {
  const courseRow = pickOne<{ campus_id?: string; campus?: unknown }>(course);
  if (!courseRow) return undefined;
  if (courseRow.campus_id) return courseRow.campus_id;
  const campus = pickOne<{ id?: string }>(courseRow.campus);
  return campus?.id;
}

function mapInvoiceRow(row: Record<string, unknown>): AdminInvoiceRow | null {
  const transaction = pickOne<{
    id: string;
    course: unknown;
  }>(row.transaction);
  const course = pickOne<{
    id: string;
    subject: string | null;
    title: string;
    scheduled_at: string | null;
    campus_id?: string;
    campus: unknown;
    provider: unknown;
    client: unknown;
  }>(transaction?.course);

  if (!transaction || !course) return null;

  const campus = pickOne<{ name: string }>(course.campus);
  const provider = pickOne<PersonRow>(course.provider);
  const client = pickOne<PersonRow>(course.client);
  const invoiceType = row.invoice_type as "parent" | "student";
  const invoiceNumber = row.invoice_number as string;
  const courseSubject = course.subject ?? course.title ?? "Cours";

  return {
    id: row.id as string,
    invoice_type: invoiceType,
    invoice_number: invoiceNumber,
    amount: Number(row.amount),
    created_at: row.created_at as string,
    parent_email_sent_at: (row.parent_email_sent_at as string | null) ?? null,
    transaction_id: (row.transaction_id as string) ?? transaction.id,
    course_id: (row.course_id as string) ?? course.id,
    parent_name: formatPersonName(client),
    prof_name: formatPersonName(provider),
    provider_profile_id: (row.provider_profile_id as string | null) ?? null,
    client_profile_id: (row.client_profile_id as string | null) ?? null,
    course_subject: courseSubject,
    course_title: course.title,
    scheduled_at: course.scheduled_at,
    campus_name: campus?.name ?? null,
    campus_id: course.campus_id ?? null,
    download_filename: buildInvoiceDownloadFilename({
      invoiceNumber,
      invoiceType,
      parentLastName: lastName(client),
      profLastName: lastName(provider),
      subject: courseSubject,
    }),
  };
}

function formatBillingPeriodLabel(billingPeriod: string): string {
  return new Date(`${billingPeriod}T00:00:00.000Z`).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}

function mapMonthlyInvoiceRow(
  row: Record<string, unknown>,
): AdminInvoiceRow | null {
  const profile = pickOne<PersonRow>(row.profile);
  const invoiceType = row.invoice_type as "parent" | "student";
  const invoiceNumber = row.invoice_number as string;
  const billingPeriod = row.billing_period as string;
  const lineCount = Number(row.line_count ?? 0);
  const periodLabel = formatBillingPeriodLabel(billingPeriod);
  const courseSubject = `Facture mensuelle — ${periodLabel} (${lineCount} cours)`;
  const personName = formatPersonName(profile);

  return {
    id: row.id as string,
    invoice_type: invoiceType,
    invoice_number: invoiceNumber,
    amount: Number(row.amount),
    created_at: row.created_at as string,
    parent_email_sent_at: (row.email_sent_at as string | null) ?? null,
    transaction_id: row.id as string,
    course_id: row.id as string,
    parent_name: invoiceType === "parent" ? personName : "—",
    prof_name: invoiceType === "student" ? personName : "—",
    provider_profile_id:
      invoiceType === "student" ? ((row.profile_id as string) ?? null) : null,
    client_profile_id:
      invoiceType === "parent" ? ((row.profile_id as string) ?? null) : null,
    course_subject: courseSubject,
    course_title: courseSubject,
    scheduled_at: `${billingPeriod}T12:00:00.000Z`,
    campus_name: null,
    campus_id: null,
    download_filename: `facture-mensuelle-${invoiceNumber.replace(/\s+/g, "-")}.pdf`,
    is_monthly: true,
    line_count: lineCount,
  };
}

const INVOICE_SELECT = `
  id,
  transaction_id,
  course_id,
  invoice_type,
  invoice_number,
  amount,
  created_at,
  parent_email_sent_at,
  storage_path,
  provider_profile_id,
  client_profile_id,
  transaction:transaction_id (
    id,
    status_stripe,
    course:course_id (
      id,
      subject,
      title,
      scheduled_at,
      campus_id,
      campus:campus_id ( name ),
      provider:provider_id ( first_name, last_name ),
      client:client_id ( first_name, last_name )
    )
  )
`;

const MONTHLY_INVOICE_SELECT = `
  id,
  invoice_type,
  billing_period,
  profile_id,
  invoice_number,
  amount,
  line_count,
  created_at,
  email_sent_at,
  storage_path,
  profile:profile_id ( first_name, last_name )
`;

function isInPeriod(
  createdAt: string,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start && !end) return true;
  const date = new Date(createdAt);
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
}

function matchesInvoiceSearch(row: AdminInvoiceRow, search: string): boolean {
  const haystack = [
    row.invoice_number,
    row.parent_name,
    row.prof_name,
    row.course_subject,
    row.course_title,
    row.campus_name ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

export async function fetchAdminInvoices(
  scopeCampusId: string | undefined,
  params: AdminInvoicesQuery,
): Promise<{ invoices: AdminInvoiceRow[]; meta: AdminInvoicesMeta }> {
  const period = params.period ?? "month";
  const effectiveCampusId = resolveAdminBudgetCampusId(
    scopeCampusId,
    params.campusId,
  );
  const { start, end } = getPeriodBounds(period);
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;

  const [monthlyResult, legacyResult] = await Promise.all([
    supabaseAdmin
      .from("monthly_invoices")
      .select(MONTHLY_INVOICE_SELECT)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("payment_invoices")
      .select(INVOICE_SELECT)
      .order("created_at", { ascending: false }),
  ]);

  if (monthlyResult.error) {
    throw new Error(monthlyResult.error.message);
  }
  if (legacyResult.error) {
    throw new Error(legacyResult.error.message);
  }

  let mapped = [
    ...(monthlyResult.data ?? [])
      .map((row) => mapMonthlyInvoiceRow(row as Record<string, unknown>))
      .filter((row): row is AdminInvoiceRow => row !== null),
    ...(legacyResult.data ?? [])
      .map((row) => mapInvoiceRow(row as Record<string, unknown>))
      .filter((row): row is AdminInvoiceRow => row !== null),
  ].filter((row) =>
    isInPeriod(row.scheduled_at ?? row.created_at, start, end),
  );

  if (effectiveCampusId) {
    mapped = mapped.filter((row) => row.campus_id === effectiveCampusId);
  }

  if (params.invoiceType) {
    mapped = mapped.filter((row) => row.invoice_type === params.invoiceType);
  }

  if (params.emailStatus) {
    mapped = mapped.filter((row) => {
      if (row.invoice_type !== "parent") return false;
      const sent = Boolean(row.parent_email_sent_at);
      return params.emailStatus === "sent" ? sent : !sent;
    });
  }

  if (params.search?.trim()) {
    mapped = mapped.filter((row) =>
      matchesInvoiceSearch(row, params.search!.trim()),
    );
  }

  const total = mapped.length;
  const offset = (page - 1) * limit;
  const invoices = mapped.slice(offset, offset + limit);

  return {
    invoices,
    meta: { total, page, pageSize: limit },
  };
}

export async function fetchAdminTransactionInvoices(
  transactionId: string,
  scopeCampusId: string | undefined,
): Promise<AdminInvoiceRow[]> {
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("transactions")
    .select("id, course:courses!inner ( campus_id )")
    .eq("id", transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    throw new Error("Transaction introuvable");
  }

  const course = transaction.course as
    | { campus_id: string }
    | { campus_id: string }[]
    | { campus_id: string }[][];
  let campusId: string | undefined;
  if (Array.isArray(course)) {
    const first = course[0];
    campusId = Array.isArray(first)
      ? (first[0] as { campus_id?: string })?.campus_id
      : (first as { campus_id?: string })?.campus_id;
  } else {
    campusId = course.campus_id;
  }

  if (scopeCampusId && campusId !== scopeCampusId) {
    throw new Error("Transaction hors périmètre");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_invoices")
    .select(INVOICE_SELECT)
    .eq("transaction_id", transactionId)
    .order("invoice_type");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapInvoiceRow(row as Record<string, unknown>))
    .filter((row): row is AdminInvoiceRow => row !== null);
}

export async function fetchInvoiceSummariesForTransactions(
  transactionIds: string[],
): Promise<Map<string, AdminTransactionInvoiceSummary>> {
  const result = new Map<string, AdminTransactionInvoiceSummary>();
  if (transactionIds.length === 0) return result;

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("id, invoice_status")
    .in("id", transactionIds);

  if (error) {
    console.warn("[billing] résumé factures:", error.message);
    return result;
  }

  for (const row of data ?? []) {
    const invoiced = row.invoice_status === "invoiced";
    result.set(row.id as string, {
      invoice_count: invoiced ? 2 : 0,
      parent_email_sent: invoiced,
    });
  }

  return result;
}

async function loadInvoiceForScope(
  invoiceId: string,
  scopeCampusId: string | undefined,
): Promise<AdminInvoiceRow & { storage_path: string; client_profile_id: string | null }> {
  const { data: monthly, error: monthlyError } = await supabaseAdmin
    .from("monthly_invoices")
    .select(MONTHLY_INVOICE_SELECT)
    .eq("id", invoiceId)
    .maybeSingle();

  if (monthlyError) {
    throw new Error(monthlyError.message);
  }

  if (monthly) {
    const mapped = mapMonthlyInvoiceRow(monthly as Record<string, unknown>);
    if (!mapped) {
      throw new Error("Facture introuvable");
    }
    return {
      ...mapped,
      storage_path: monthly.storage_path as string,
      client_profile_id:
        mapped.invoice_type === "parent"
          ? ((monthly.profile_id as string) ?? null)
          : null,
    };
  }

  const { data: invoice, error } = await supabaseAdmin
    .from("payment_invoices")
    .select(INVOICE_SELECT)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !invoice) {
    throw new Error("Facture introuvable");
  }

  const mapped = mapInvoiceRow(invoice as Record<string, unknown>);
  if (!mapped) {
    throw new Error("Facture introuvable");
  }

  const transaction = pickOne<{ course: unknown; status_stripe?: string }>(
    (invoice as Record<string, unknown>).transaction,
  );
  const campusId = extractCampusId(transaction?.course);

  if (scopeCampusId && campusId !== scopeCampusId) {
    throw new Error("Facture hors périmètre");
  }

  return {
    ...mapped,
    storage_path: invoice.storage_path as string,
    client_profile_id: (invoice.client_profile_id as string | null) ?? null,
  };
}

export async function createAdminInvoiceSignedUrl(
  invoiceId: string,
  scopeCampusId: string | undefined,
): Promise<string> {
  const invoice = await loadInvoiceForScope(invoiceId, scopeCampusId);
  return createInvoiceSignedUrl(invoice.storage_path);
}

export async function downloadAdminInvoicePdf(
  invoiceId: string,
  scopeCampusId: string | undefined,
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const invoice = await loadInvoiceForScope(invoiceId, scopeCampusId);

  const { data, error } = await supabaseAdmin.storage
    .from(INVOICES_BUCKET)
    .download(invoice.storage_path);

  if (error || !data) {
    throw new Error(error?.message ?? "PDF introuvable");
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    filename: invoice.download_filename,
    mimeType: "application/pdf",
  };
}

async function getClientEmail(clientId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(clientId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export async function resendParentInvoiceEmail(
  invoiceId: string,
  scopeCampusId: string | undefined,
): Promise<{ sent: boolean; skipped: boolean; reason?: string }> {
  const invoice = await loadInvoiceForScope(invoiceId, scopeCampusId);

  if (invoice.invoice_type !== "parent") {
    throw new Error("Seules les factures parent peuvent être renvoyées par e-mail");
  }

  if (!invoice.is_monthly) {
    const transaction = await supabaseAdmin
      .from("transactions")
      .select("status_stripe")
      .eq("id", invoice.transaction_id)
      .maybeSingle();

    if (transaction.data?.status_stripe !== "succeeded") {
      throw new Error("Paiement non confirmé — envoi impossible");
    }
  }

  if (!invoice.client_profile_id) {
    throw new Error("Client introuvable pour cette facture");
  }

  const clientEmail = await getClientEmail(invoice.client_profile_id);
  if (!clientEmail) {
    throw new Error("E-mail du parent introuvable");
  }

  const { buffer } = await downloadAdminInvoicePdf(invoiceId, scopeCampusId);

  if (invoice.is_monthly) {
    const periodLabel = formatBillingPeriodLabel(
      (invoice.scheduled_at ?? invoice.created_at).slice(0, 10),
    );
    const emailResult = await sendMonthlyParentInvoiceEmail({
      to: clientEmail,
      parentName: invoice.parent_name,
      invoiceNumber: invoice.invoice_number,
      billingPeriodLabel: periodLabel,
      totalAmount: invoice.amount,
      lineCount: invoice.line_count ?? 1,
      pdfBuffer: buffer,
      downloadFilename: invoice.download_filename,
    });

    if (emailResult.sent) {
      await supabaseAdmin
        .from("monthly_invoices")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", invoiceId);
    }

    return emailResult;
  }

  const emailResult = await sendParentInvoiceEmail({
    to: clientEmail,
    parentName: invoice.parent_name,
    invoiceNumber: invoice.invoice_number,
    amountGross: invoice.amount,
    subject: invoice.course_subject,
    pdfBuffer: buffer,
    downloadFilename: invoice.download_filename,
  });

  if (emailResult.sent) {
    await supabaseAdmin
      .from("payment_invoices")
      .update({ parent_email_sent_at: new Date().toISOString() })
      .eq("id", invoiceId);
  }

  return emailResult;
}

export function parseAdminInvoicesQuery(
  query: Record<string, unknown>,
): AdminInvoicesQuery {
  const periodRaw = String(query.period ?? "month");
  const period = ["month", "week", "30d", "all"].includes(periodRaw)
    ? (periodRaw as AdminBudgetPeriod)
    : "month";

  const invoiceTypeRaw = query.invoice_type
    ? String(query.invoice_type)
    : undefined;
  const invoiceType =
    invoiceTypeRaw === "parent" || invoiceTypeRaw === "student"
      ? invoiceTypeRaw
      : undefined;

  const emailStatusRaw = query.email_status
    ? String(query.email_status)
    : undefined;
  const emailStatus =
    emailStatusRaw === "sent" || emailStatusRaw === "not_sent"
      ? emailStatusRaw
      : undefined;

  const page = query.page ? Number.parseInt(String(query.page), 10) : 1;
  const limit = query.limit ? Number.parseInt(String(query.limit), 10) : 50;

  return {
    period,
    campusId: query.campus_id ? String(query.campus_id) : undefined,
    invoiceType,
    search: query.search ? String(query.search) : undefined,
    emailStatus,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50,
  };
}
