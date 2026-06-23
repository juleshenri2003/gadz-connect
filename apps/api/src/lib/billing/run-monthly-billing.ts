import {
  getBillingPeriodBounds,
  resolveBillingPeriodInput,
  isScheduledInPeriod,
  type BillingPeriodYm,
} from "./billing-period.js";
import {
  formatFrenchDate,
  formatMonthlyInvoiceNumber,
} from "./format.js";
import {
  monthlyInvoiceStoragePath,
  uploadInvoicePdf,
} from "./invoice-storage.js";
import { getPlatformBillingConfig } from "./platform-config.js";
import { sendMonthlyParentInvoiceEmail } from "../email/send-monthly-parent-invoice.js";
import { sendMonthlyStudentInvoiceEmail } from "../email/send-monthly-student-invoice.js";
import { buildMonthlyParentInvoicePdf } from "../pdf/monthly-parent-invoice.js";
import { buildMonthlyStudentInvoicePdf } from "../pdf/monthly-student-invoice.js";
import { supabaseAdmin } from "../supabase.js";

export interface RunMonthlyBillingOptions {
  /** Période YYYY-MM ; défaut = mois civil précédent. */
  period?: string;
  dryRun?: boolean;
}

export interface RunMonthlyBillingResult {
  period: BillingPeriodYm;
  parentInvoices: number;
  studentInvoices: number;
  linesInvoiced: number;
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

interface PendingBillingLine {
  transactionId: string;
  courseId: string;
  clientId: string;
  providerId: string;
  parentAmount: number;
  studentAmount: number;
  subject: string;
  scheduledAt: string | null;
  endsAt: string | null;
  client: PersonProfile | null;
  provider: PersonProfile | null;
}

const TRANSACTION_SELECT = `
  id,
  course_id,
  amount_gross,
  commission_sasu,
  total_paid_parent,
  platform_commission,
  teacher_gross_revenue,
  invoice_status,
  status_stripe,
  course:courses!inner (
    id,
    subject,
    title,
    scheduled_at,
    client_id,
    provider_id,
    slot_id,
    client:client_id ( id, first_name, last_name ),
    provider:provider_id (
      id, first_name, last_name, siret, micro_enterprise_address
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

async function nextMonthlyInvoiceSequence(
  invoiceType: "parent" | "student",
  periodCompact: string,
): Promise<number> {
  const prefix =
    invoiceType === "parent"
      ? `GC-PARENT-M-${periodCompact}-`
      : `GC-STUDENT-M-${periodCompact}-`;

  const { data, error } = await supabaseAdmin
    .from("monthly_invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`);

  if (error) {
    console.warn("[billing] compteur factures mensuelles:", error.message);
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

async function fetchPendingLines(
  bounds: ReturnType<typeof getBillingPeriodBounds>,
): Promise<PendingBillingLine[]> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("status_stripe", "succeeded")
    .eq("invoice_status", "pending_invoice");

  if (error) {
    throw new Error(error.message);
  }

  const lines: PendingBillingLine[] = [];

  for (const row of data ?? []) {
    const course = pickOne<{
      id: string;
      subject: string | null;
      title: string;
      scheduled_at: string | null;
      client_id: string;
      provider_id: string;
      slot_id: string | null;
      client: PersonProfile | PersonProfile[] | null;
      provider: PersonProfile | PersonProfile[] | null;
    }>(row.course);

    if (!course?.scheduled_at) continue;
    if (!isScheduledInPeriod(course.scheduled_at, bounds)) continue;

    const endsAt = await loadSlotEndsAt(course.slot_id);
    const parentAmount = Number(
      row.total_paid_parent ?? row.amount_gross ?? 0,
    );
    const studentAmount = Number(
      row.teacher_gross_revenue ??
        parentAmount - Number(row.commission_sasu ?? 0),
    );

    lines.push({
      transactionId: row.id as string,
      courseId: course.id,
      clientId: course.client_id,
      providerId: course.provider_id,
      parentAmount: round2(parentAmount),
      studentAmount: round2(studentAmount),
      subject: course.subject ?? course.title ?? "Cours particulier",
      scheduledAt: course.scheduled_at,
      endsAt,
      client: pickOne<PersonProfile>(course.client),
      provider: pickOne<PersonProfile>(course.provider),
    });
  }

  return lines;
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

async function monthlyInvoiceExists(
  invoiceType: "parent" | "student",
  profileId: string,
  billingPeriodStart: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("monthly_invoices")
    .select("id")
    .eq("invoice_type", invoiceType)
    .eq("profile_id", profileId)
    .eq("billing_period", billingPeriodStart)
    .maybeSingle();
  return Boolean(data);
}

async function finalizeMonthlyInvoice(input: {
  invoiceType: "parent" | "student";
  profileId: string;
  bounds: ReturnType<typeof getBillingPeriodBounds>;
  lines: PendingBillingLine[];
  dryRun: boolean;
}): Promise<{ created: boolean; emailSent: boolean }> {
  const { invoiceType, profileId, bounds, lines, dryRun } = input;

  if (lines.length === 0) {
    return { created: false, emailSent: false };
  }

  const exists = await monthlyInvoiceExists(
    invoiceType,
    profileId,
    bounds.start,
  );
  if (exists) {
    console.info(
      `[billing] facture ${invoiceType} déjà émise pour ${profileId} — ${bounds.period}`,
    );
    return { created: false, emailSent: false };
  }

  const platform = getPlatformBillingConfig();
  const invoiceDate = formatFrenchDate(new Date().toISOString());
  const sequence = await nextMonthlyInvoiceSequence(
    invoiceType,
    bounds.compact,
  );
  const invoiceNumber = formatMonthlyInvoiceNumber(
    invoiceType === "parent" ? "PARENT" : "STUDENT",
    bounds.compact,
    sequence,
  );

  const totalAmount = round2(
    lines.reduce(
      (sum, line) =>
        sum + (invoiceType === "parent" ? line.parentAmount : line.studentAmount),
      0,
    ),
  );

  if (dryRun) {
    console.info(
      `[billing] [dry-run] ${invoiceType} ${invoiceNumber} — ${lines.length} lignes — ${totalAmount} €`,
    );
    return { created: true, emailSent: false };
  }

  let pdfBuffer: Buffer;
  const person =
    invoiceType === "parent" ? lines[0]!.client : lines[0]!.provider;

  if (invoiceType === "parent") {
    pdfBuffer = await buildMonthlyParentInvoicePdf({
      invoiceNumber,
      invoiceDate,
      billingPeriodLabel: bounds.label,
      platform,
      parentName: personName(person),
      lines: lines.map((line) => ({
        scheduledAt: line.scheduledAt,
        endsAt: line.endsAt,
        subject: line.subject,
        tutorName: personName(line.provider),
        amount: line.parentAmount,
      })),
      totalAmount,
    });
  } else {
    const provider = lines[0]!.provider;
    pdfBuffer = await buildMonthlyStudentInvoicePdf({
      invoiceNumber,
      invoiceDate,
      billingPeriodLabel: bounds.label,
      platform,
      studentLegalName: `${personName(provider)} EI`,
      studentSiret: provider?.siret ?? "00000000000000",
      studentAddress:
        provider?.micro_enterprise_address?.trim() ||
        "Adresse de l'auto-entreprise non renseignée",
      lines: lines.map((line) => ({
        scheduledAt: line.scheduledAt,
        subject: line.subject,
        amount: line.studentAmount,
      })),
      totalAmount,
    });
  }

  const { data: monthlyRow, error: insertError } = await supabaseAdmin
    .from("monthly_invoices")
    .insert({
      invoice_type: invoiceType,
      billing_period: bounds.start,
      profile_id: profileId,
      invoice_number: invoiceNumber,
      amount: totalAmount,
      line_count: lines.length,
      storage_path: "pending",
    })
    .select("id")
    .single();

  if (insertError || !monthlyRow) {
    throw new Error(insertError?.message ?? "Insertion facture mensuelle échouée");
  }

  const monthlyInvoiceId = monthlyRow.id as string;
  const storagePath = monthlyInvoiceStoragePath(
    invoiceType,
    bounds.compact,
    monthlyInvoiceId,
  );

  await uploadInvoicePdf(storagePath, pdfBuffer);

  const { error: lineError } = await supabaseAdmin
    .from("monthly_invoice_lines")
    .insert(
      lines.map((line) => ({
        monthly_invoice_id: monthlyInvoiceId,
        transaction_id: line.transactionId,
        amount:
          invoiceType === "parent" ? line.parentAmount : line.studentAmount,
      })),
    );

  if (lineError) {
    throw new Error(lineError.message);
  }

  await supabaseAdmin
    .from("monthly_invoices")
    .update({ storage_path: storagePath })
    .eq("id", monthlyInvoiceId);

  const email = await getProfileEmail(profileId);
  let emailSent = false;

  if (email) {
    if (invoiceType === "parent") {
      const result = await sendMonthlyParentInvoiceEmail({
        to: email,
        parentName: personName(person),
        invoiceNumber,
        billingPeriodLabel: bounds.label,
        totalAmount,
        lineCount: lines.length,
        pdfBuffer,
      });
      emailSent = result.sent;
    } else {
      const result = await sendMonthlyStudentInvoiceEmail({
        to: email,
        studentName: personName(person),
        invoiceNumber,
        billingPeriodLabel: bounds.label,
        totalAmount,
        lineCount: lines.length,
        pdfBuffer,
      });
      emailSent = result.sent;
    }

    if (emailSent) {
      await supabaseAdmin
        .from("monthly_invoices")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", monthlyInvoiceId);
    }
  } else {
    console.warn(
      `[billing] e-mail introuvable pour ${profileId} — PDF stocké uniquement`,
    );
  }

  return { created: true, emailSent };
}

async function closeInvoicedTransactions(
  transactionIds: string[],
): Promise<number> {
  if (transactionIds.length === 0) return 0;

  const { data, error } = await supabaseAdmin
    .from("monthly_invoice_lines")
    .select(
      "transaction_id, monthly_invoice:monthly_invoices ( invoice_type )",
    )
    .in("transaction_id", transactionIds);

  if (error) {
    throw new Error(error.message);
  }

  const typesByTx = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const txId = row.transaction_id as string;
    const invoiceType = pickOne<{ invoice_type: string }>(
      row.monthly_invoice,
    )?.invoice_type;
    if (!invoiceType) continue;
    const set = typesByTx.get(txId) ?? new Set<string>();
    set.add(invoiceType);
    typesByTx.set(txId, set);
  }

  const ready = transactionIds.filter((id) => {
    const types = typesByTx.get(id);
    return types?.has("parent") && types?.has("student");
  });

  if (ready.length === 0) return 0;

  const { error: updateError } = await supabaseAdmin
    .from("transactions")
    .update({ invoice_status: "invoiced" })
    .in("id", ready);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return ready.length;
}

/**
 * Facturation mensuelle : regroupe les transactions `pending_invoice`
 * du mois civil, génère une facture parent et une note de débours étudiant
 * par bénéficiaire, envoie les e-mails et passe les lignes à `invoiced`.
 */
export async function runMonthlyBilling(
  options: RunMonthlyBillingOptions = {},
): Promise<RunMonthlyBillingResult> {
  const period = resolveBillingPeriodInput(options.period);
  const bounds = getBillingPeriodBounds(period);
  const dryRun = options.dryRun ?? false;

  console.info(
    `[billing] facturation mensuelle — période ${bounds.label}${dryRun ? " (dry-run)" : ""}`,
  );

  const pendingLines = await fetchPendingLines(bounds);

  if (pendingLines.length === 0) {
    console.info("[billing] aucune ligne en attente pour cette période.");
    return {
      period,
      parentInvoices: 0,
      studentInvoices: 0,
      linesInvoiced: 0,
      emailsSent: 0,
      skippedExisting: 0,
    };
  }

  const parentGroups = groupBy(pendingLines, (line) => line.clientId);
  const studentGroups = groupBy(pendingLines, (line) => line.providerId);

  let parentInvoices = 0;
  let studentInvoices = 0;
  let emailsSent = 0;
  let skippedExisting = 0;

  for (const [clientId, lines] of parentGroups) {
    const result = await finalizeMonthlyInvoice({
      invoiceType: "parent",
      profileId: clientId,
      bounds,
      lines,
      dryRun,
    });
    if (result.created) {
      parentInvoices += 1;
      if (result.emailSent) emailsSent += 1;
    } else if (!dryRun) {
      skippedExisting += 1;
    }
  }

  for (const [providerId, lines] of studentGroups) {
    const result = await finalizeMonthlyInvoice({
      invoiceType: "student",
      profileId: providerId,
      bounds,
      lines,
      dryRun,
    });
    if (result.created) {
      studentInvoices += 1;
      if (result.emailSent) emailsSent += 1;
    } else if (!dryRun) {
      skippedExisting += 1;
    }
  }

  let closedCount = 0;
  if (!dryRun) {
    const allTxIds = [...new Set(pendingLines.map((line) => line.transactionId))];
    closedCount = await closeInvoicedTransactions(allTxIds);
  } else {
    closedCount = pendingLines.length;
  }

  return {
    period,
    parentInvoices,
    studentInvoices,
    linesInvoiced: closedCount,
    emailsSent,
    skippedExisting,
  };
}
