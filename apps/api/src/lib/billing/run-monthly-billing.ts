import {
  getBillingPeriodBounds,
  resolveBillingPeriodInput,
  isInBillingPeriod,
  type BillingPeriodYm,
} from "./billing-period.js";
import {
  formatFrenchDate,
  formatMonthlySummaryNumber,
} from "./format.js";
import {
  monthlyInvoiceStoragePath,
  uploadInvoicePdf,
} from "./invoice-storage.js";
import { getPlatformBillingConfig } from "./platform-config.js";
import { aggregateProviderUrssafSynthesis } from "./provider-monthly-urssaf.js";
import { sendMonthlyParentSummaryEmail } from "../email/send-monthly-parent-invoice.js";
import { sendMonthlyProviderSummaryEmail } from "../email/send-monthly-student-invoice.js";
import { buildMonthlyParentSummaryPdf } from "../pdf/monthly-parent-invoice.js";
import { buildMonthlyProviderSummaryPdf } from "../pdf/monthly-student-invoice.js";
import { supabaseAdmin } from "../supabase.js";

export interface RunMonthlyBillingOptions {
  /** Période YYYY-MM ; défaut = mois civil précédent. */
  period?: string;
  dryRun?: boolean;
}

export interface RunMonthlyBillingResult {
  period: BillingPeriodYm;
  parentSummaries: number;
  providerSummaries: number;
  linesIncluded: number;
  emailsSent: number;
  skippedExisting: number;
}

interface PersonProfile {
  id: string;
  first_name: string;
  last_name: string;
  siret?: string | null;
  micro_enterprise_address?: string | null;
}

interface SummaryLine {
  transactionId: string;
  paymentInvoiceId: string;
  invoiceNumber: string;
  amount: number;
  subject: string;
  scheduledAt: string | null;
  invoicedAt: string | null;
  endsAt: string | null;
  profileId: string;
  client: PersonProfile | null;
  provider: PersonProfile | null;
}

const PAYMENT_INVOICE_SELECT = `
  id,
  invoice_type,
  invoice_number,
  amount,
  created_at,
  transaction_id,
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
      slot_id,
      client_id,
      provider_id,
      client:client_id ( id, first_name, last_name ),
      provider:provider_id (
        id, first_name, last_name, siret, micro_enterprise_address
      )
    )
  )
`;

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function personName(person: PersonProfile | null): string {
  if (!person) return "—";
  return `${person.first_name} ${person.last_name}`.trim() || "—";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function nextSummarySequence(
  prefix: "RELEVE-PROF" | "RELEVE-PARENT",
  periodCompact: string,
): Promise<number> {
  const likePrefix = `GC-${prefix}-${periodCompact}-`;

  const { data, error } = await supabaseAdmin
    .from("monthly_invoices")
    .select("invoice_number")
    .like("invoice_number", `${likePrefix}%`);

  if (error) {
    console.warn("[billing] compteur relevés mensuels:", error.message);
    return 1;
  }

  let maxSequence = 0;
  for (const row of data ?? []) {
    const match = (row.invoice_number as string).match(/-(\d+)$/);
    if (match) {
      maxSequence = Math.max(maxSequence, Number.parseInt(match[1]!, 10));
    }
  }

  return maxSequence + 1;
}

async function getProfileEmail(profileId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(profileId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function loadSlotEndsAt(slotId: string | null): Promise<string | null> {
  if (!slotId) return null;
  const { data } = await supabaseAdmin
    .from("tutor_slots")
    .select("ends_at")
    .eq("id", slotId)
    .maybeSingle();
  return (data?.ends_at as string) ?? null;
}

async function fetchLinkedTransactionIds(
  transactionIds: string[],
): Promise<Set<string>> {
  if (transactionIds.length === 0) return new Set();

  const { data, error } = await supabaseAdmin
    .from("monthly_invoice_lines")
    .select("transaction_id")
    .in("transaction_id", transactionIds);

  if (error) {
    console.warn("[billing] lignes relevé existantes:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.transaction_id as string));
}

async function fetchInvoicedLinesForPeriod(
  invoiceType: "parent" | "student",
  bounds: ReturnType<typeof getBillingPeriodBounds>,
  options?: { onlyUnlinked?: boolean; profileId?: string },
): Promise<SummaryLine[]> {
  const onlyUnlinked = options?.onlyUnlinked ?? true;
  const profileIdFilter = options?.profileId?.trim();

  const { data, error } = await supabaseAdmin
    .from("payment_invoices")
    .select(PAYMENT_INVOICE_SELECT)
    .eq("invoice_type", invoiceType);

  if (error) {
    throw new Error(error.message);
  }

  const lines: SummaryLine[] = [];

  for (const row of data ?? []) {
    const transaction = pickOne<{
      id: string;
      status_stripe: string;
      course: unknown;
    }>(row.transaction);

    if (transaction?.status_stripe !== "succeeded") continue;

    const course = pickOne<{
      id: string;
      subject: string | null;
      title: string;
      scheduled_at: string | null;
      slot_id: string | null;
      client: PersonProfile | PersonProfile[] | null;
      provider: PersonProfile | PersonProfile[] | null;
    }>(transaction.course);

    if (!course) continue;
    if (
      !isInBillingPeriod(
        course.scheduled_at,
        row.created_at as string,
        bounds,
      )
    ) {
      continue;
    }

    const endsAt = await loadSlotEndsAt(course.slot_id);
    const profileId =
      invoiceType === "parent"
        ? ((row.client_profile_id as string | null) ??
          pickOne<PersonProfile>(course.client)?.id ??
          "")
        : ((row.provider_profile_id as string | null) ??
          pickOne<PersonProfile>(course.provider)?.id ??
          "");

    if (profileIdFilter && profileId !== profileIdFilter) continue;

    lines.push({
      transactionId: row.transaction_id as string,
      paymentInvoiceId: row.id as string,
      invoiceNumber: row.invoice_number as string,
      amount: round2(Number(row.amount)),
      subject: course.subject ?? course.title ?? "Cours particulier",
      scheduledAt: course.scheduled_at,
      invoicedAt: (row.created_at as string | null) ?? null,
      endsAt,
      profileId,
      client: pickOne<PersonProfile>(course.client),
      provider: pickOne<PersonProfile>(course.provider),
    });
  }

  if (!onlyUnlinked) {
    return sortSummaryLines(lines);
  }

  const linked = await fetchLinkedTransactionIds(
    lines.map((line) => line.transactionId),
  );

  return sortSummaryLines(
    lines.filter((line) => !linked.has(line.transactionId)),
  );
}

function sortSummaryLines(lines: SummaryLine[]): SummaryLine[] {
  return [...lines].sort((left, right) => {
    const leftTime = new Date(
      left.scheduledAt ?? left.invoicedAt ?? 0,
    ).getTime();
    const rightTime = new Date(
      right.scheduledAt ?? right.invoicedAt ?? 0,
    ).getTime();
    return leftTime - rightTime;
  });
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

async function getExistingMonthlySummary(
  invoiceType: "parent" | "student",
  profileId: string,
  billingPeriodStart: string,
): Promise<{
  id: string;
  invoice_number: string;
  storage_path: string;
} | null> {
  const { data } = await supabaseAdmin
    .from("monthly_invoices")
    .select("id, invoice_number, storage_path")
    .eq("invoice_type", invoiceType)
    .eq("profile_id", profileId)
    .eq("billing_period", billingPeriodStart)
    .maybeSingle();
  return data ?? null;
}

function computeTotalAmount(lines: SummaryLine[]): number {
  return round2(lines.reduce((sum, line) => sum + line.amount, 0));
}

async function buildMonthlySummaryPdf(input: {
  invoiceType: "parent" | "student";
  profileId: string;
  summaryNumber: string;
  invoiceDate: string;
  billingPeriodLabel: string;
  lines: SummaryLine[];
  totalAmount: number;
}): Promise<{
  pdfBuffer: Buffer;
  providerUrssafSynthesis?: Awaited<
    ReturnType<typeof aggregateProviderUrssafSynthesis>
  >;
}> {
  const platform = getPlatformBillingConfig();

  if (input.invoiceType === "parent") {
    return {
      pdfBuffer: await buildMonthlyParentSummaryPdf({
        summaryNumber: input.summaryNumber,
        invoiceDate: input.invoiceDate,
        billingPeriodLabel: input.billingPeriodLabel,
        platform,
        parentName: personName(input.lines[0]!.client),
        lines: input.lines.map((line) => ({
          scheduledAt: line.scheduledAt ?? line.invoicedAt,
          endsAt: line.endsAt,
          subject: line.subject,
          tutorName: personName(line.provider),
          amount: line.amount,
          invoiceNumber: line.invoiceNumber,
        })),
        totalAmount: input.totalAmount,
      }),
    };
  }

  const provider = input.lines[0]!.provider;
  const providerUrssafSynthesis = await aggregateProviderUrssafSynthesis({
    transactionIds: input.lines.map((line) => line.transactionId),
    providerProfileId: input.profileId,
    courseCount: input.lines.length,
  });

  return {
    providerUrssafSynthesis,
    pdfBuffer: await buildMonthlyProviderSummaryPdf({
      summaryNumber: input.summaryNumber,
      invoiceDate: input.invoiceDate,
      billingPeriodLabel: input.billingPeriodLabel,
      platform,
      studentLegalName: `${personName(provider)} EI`,
      studentSiret: provider?.siret ?? "00000000000000",
      studentAddress:
        provider?.micro_enterprise_address?.trim() ||
        "Adresse de l'auto-entreprise non renseignée",
      lines: input.lines.map((line) => ({
        scheduledAt: line.scheduledAt ?? line.invoicedAt,
        subject: line.subject,
        amount: line.amount,
        invoiceNumber: line.invoiceNumber,
      })),
      totalAmount: input.totalAmount,
      urssafSynthesis: providerUrssafSynthesis,
    }),
  };
}

async function sendMonthlySummaryEmail(input: {
  invoiceType: "parent" | "student";
  profileId: string;
  lines: SummaryLine[];
  summaryNumber: string;
  billingPeriodLabel: string;
  totalAmount: number;
  pdfBuffer: Buffer;
  providerUrssafSynthesis?: Awaited<
    ReturnType<typeof aggregateProviderUrssafSynthesis>
  >;
}): Promise<boolean> {
  const email = await getProfileEmail(input.profileId);
  if (!email) {
    console.warn(
      `[billing] e-mail introuvable pour ${input.profileId} — relevé stocké uniquement`,
    );
    return false;
  }

  if (input.invoiceType === "parent") {
    const result = await sendMonthlyParentSummaryEmail({
      to: email,
      parentName: personName(input.lines[0]!.client),
      summaryNumber: input.summaryNumber,
      billingPeriodLabel: input.billingPeriodLabel,
      totalAmount: input.totalAmount,
      lineCount: input.lines.length,
      pdfBuffer: input.pdfBuffer,
    });
    return result.sent;
  }

  const result = await sendMonthlyProviderSummaryEmail({
    to: email,
    studentName: personName(input.lines[0]!.provider),
    summaryNumber: input.summaryNumber,
    billingPeriodLabel: input.billingPeriodLabel,
    totalAmount: input.totalAmount,
    lineCount: input.lines.length,
    pdfBuffer: input.pdfBuffer,
    urssafSynthesis: input.providerUrssafSynthesis,
  });
  return result.sent;
}

async function finalizeMonthlySummary(input: {
  invoiceType: "parent" | "student";
  profileId: string;
  bounds: ReturnType<typeof getBillingPeriodBounds>;
  lines: SummaryLine[];
  dryRun: boolean;
}): Promise<{ created: boolean; emailSent: boolean; lineCount: number }> {
  const { invoiceType, profileId, bounds, lines: newLines, dryRun } = input;

  const existing = await getExistingMonthlySummary(
    invoiceType,
    profileId,
    bounds.start,
  );

  if (newLines.length === 0) {
    if (existing) {
      console.info(
        `[billing] relevé ${invoiceType} à jour pour ${profileId} — ${bounds.period}`,
      );
    }
    return { created: false, emailSent: false, lineCount: 0 };
  }

  const allLines = existing
    ? await fetchInvoicedLinesForPeriod(invoiceType, bounds, {
        onlyUnlinked: false,
        profileId,
      })
    : sortSummaryLines(newLines);

  const totalAmount = computeTotalAmount(allLines);
  const invoiceDate = formatFrenchDate(new Date().toISOString());
  const isUpdate = Boolean(existing);

  if (dryRun) {
    const summaryNumber =
      existing?.invoice_number ??
      formatMonthlySummaryNumber(
        invoiceType === "parent" ? "RELEVE-PARENT" : "RELEVE-PROF",
        bounds.compact,
        await nextSummarySequence(
          invoiceType === "parent" ? "RELEVE-PARENT" : "RELEVE-PROF",
          bounds.compact,
        ),
      );
    console.info(
      `[billing] [dry-run] relevé ${invoiceType} ${summaryNumber}${isUpdate ? " (mise à jour)" : ""} — ${allLines.length} lignes${isUpdate ? ` (+${newLines.length})` : ""} — ${totalAmount} €`,
    );
    return { created: true, emailSent: false, lineCount: allLines.length };
  }

  let summaryNumber: string;
  let monthlyInvoiceId: string;
  let storagePath: string;

  if (existing) {
    summaryNumber = existing.invoice_number;
    monthlyInvoiceId = existing.id;
    storagePath = existing.storage_path;
    console.info(
      `[billing] mise à jour relevé ${summaryNumber} — +${newLines.length} ligne(s) → ${allLines.length} total — ${totalAmount} €`,
    );
  } else {
    const numberPrefix =
      invoiceType === "parent" ? "RELEVE-PARENT" : "RELEVE-PROF";
    const sequence = await nextSummarySequence(numberPrefix, bounds.compact);
    summaryNumber = formatMonthlySummaryNumber(
      numberPrefix,
      bounds.compact,
      sequence,
    );

    const { data: monthlyRow, error: insertError } = await supabaseAdmin
      .from("monthly_invoices")
      .insert({
        invoice_type: invoiceType,
        billing_period: bounds.start,
        profile_id: profileId,
        invoice_number: summaryNumber,
        amount: totalAmount,
        line_count: allLines.length,
        storage_path: "pending",
      })
      .select("id")
      .single();

    if (insertError || !monthlyRow) {
      throw new Error(
        insertError?.message ?? "Insertion relevé mensuel échouée",
      );
    }

    monthlyInvoiceId = monthlyRow.id as string;
    storagePath = monthlyInvoiceStoragePath(
      invoiceType,
      bounds.compact,
      monthlyInvoiceId,
    );
  }

  const { pdfBuffer, providerUrssafSynthesis } = await buildMonthlySummaryPdf({
    invoiceType,
    profileId,
    summaryNumber,
    invoiceDate,
    billingPeriodLabel: bounds.label,
    lines: allLines,
    totalAmount,
  });

  await uploadInvoicePdf(storagePath, pdfBuffer);

  if (existing) {
    const { error: lineError } = await supabaseAdmin
      .from("monthly_invoice_lines")
      .insert(
        newLines.map((line) => ({
          monthly_invoice_id: monthlyInvoiceId,
          transaction_id: line.transactionId,
          amount: line.amount,
        })),
      );

    if (lineError) {
      throw new Error(lineError.message);
    }

    await supabaseAdmin
      .from("monthly_invoices")
      .update({
        amount: totalAmount,
        line_count: allLines.length,
        storage_path: storagePath,
      })
      .eq("id", monthlyInvoiceId);
  } else {
    const { error: lineError } = await supabaseAdmin
      .from("monthly_invoice_lines")
      .insert(
        allLines.map((line) => ({
          monthly_invoice_id: monthlyInvoiceId,
          transaction_id: line.transactionId,
          amount: line.amount,
        })),
      );

    if (lineError) {
      throw new Error(lineError.message);
    }

    await supabaseAdmin
      .from("monthly_invoices")
      .update({ storage_path: storagePath })
      .eq("id", monthlyInvoiceId);
  }

  const emailSent = await sendMonthlySummaryEmail({
    invoiceType,
    profileId,
    lines: allLines,
    summaryNumber,
    billingPeriodLabel: bounds.label,
    totalAmount,
    pdfBuffer,
    providerUrssafSynthesis,
  });

  if (emailSent) {
    await supabaseAdmin
      .from("monthly_invoices")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", monthlyInvoiceId);
  }

  return { created: true, emailSent, lineCount: allLines.length };
}

/**
 * Relevés mensuels : regroupe les factures par cours déjà émises au paiement,
 * génère un PDF récapitulatif (sans nouvelle facture légale) et envoie l'e-mail.
 * Par défaut : mois civil précédent (job le 1er du mois suivant).
 */
export async function runMonthlyBilling(
  options: RunMonthlyBillingOptions = {},
): Promise<RunMonthlyBillingResult> {
  const period = resolveBillingPeriodInput(options.period);
  const bounds = getBillingPeriodBounds(period);
  const dryRun = options.dryRun ?? false;

  console.info(
    `[billing] relevés mensuels — période ${bounds.label}${dryRun ? " (dry-run)" : ""}`,
  );

  const [parentLines, providerLines] = await Promise.all([
    fetchInvoicedLinesForPeriod("parent", bounds),
    fetchInvoicedLinesForPeriod("student", bounds),
  ]);

  if (parentLines.length === 0 && providerLines.length === 0) {
    console.info("[billing] aucune facture par cours pour cette période.");
    return {
      period,
      parentSummaries: 0,
      providerSummaries: 0,
      linesIncluded: 0,
      emailsSent: 0,
      skippedExisting: 0,
    };
  }

  const parentGroups = groupBy(parentLines, (line) => line.profileId);
  const providerGroups = groupBy(providerLines, (line) => line.profileId);

  let parentSummaries = 0;
  let providerSummaries = 0;
  let emailsSent = 0;
  let skippedExisting = 0;
  let linesIncluded = 0;

  for (const [clientId, lines] of parentGroups) {
    if (!clientId) continue;
    const result = await finalizeMonthlySummary({
      invoiceType: "parent",
      profileId: clientId,
      bounds,
      lines,
      dryRun,
    });
    if (result.created) {
      parentSummaries += 1;
      linesIncluded += result.lineCount;
      if (result.emailSent) emailsSent += 1;
    } else if (!dryRun) {
      skippedExisting += 1;
    }
  }

  for (const [providerId, lines] of providerGroups) {
    if (!providerId) continue;
    const result = await finalizeMonthlySummary({
      invoiceType: "student",
      profileId: providerId,
      bounds,
      lines,
      dryRun,
    });
    if (result.created) {
      providerSummaries += 1;
      linesIncluded += result.lineCount;
      if (result.emailSent) emailsSent += 1;
    } else if (!dryRun) {
      skippedExisting += 1;
    }
  }

  return {
    period,
    parentSummaries,
    providerSummaries,
    linesIncluded,
    emailsSent,
    skippedExisting,
  };
}
