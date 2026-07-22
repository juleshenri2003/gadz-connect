import type { FiscalCalculateResult } from "@gadz-connect/types";
import { calculateCommissionSasu } from "@gadz-connect/types";
import { calculateFiscalBreakdown } from "../fiscal.js";
import { supabaseAdmin } from "../supabase.js";

/** Ventilation tripartite : Parent → Plateforme (3 €) → Prof auto-entrepreneur (CA brut). */
export interface TripartiteRevenueSplit {
  /** Montant total payé par le parent via Stripe (TTC). */
  totalPaidParent: number;
  /** Commission fixe Gadz'Connect — 3 €. */
  platformCommission: number;
  /** CA brut reversé au prof avant cotisations URSSAF (ex. 37 € pour 40 €). */
  teacherGrossRevenue: number;
}

export interface TransactionRevenueRecord extends TripartiteRevenueSplit {
  /** Alias historique = totalPaidParent */
  amountGross: number;
  /** Alias historique = platformCommission */
  commissionSasu: number;
  taxesUrssaf: number;
  netPayout: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcule la ventilation à partir du prix payé par le parent.
 * Commission plateforme : 3 € fixes.
 * CA prof = total − commission (les cotisations URSSAF sont calculées à part).
 */
export function computeTripartiteRevenueSplit(
  totalPaidParent: number,
): TripartiteRevenueSplit {
  const total = round2(Math.max(0, totalPaidParent));
  const platformCommission = calculateCommissionSasu(total);
  const teacherGrossRevenue = round2(total - platformCommission);

  return {
    totalPaidParent: total,
    platformCommission,
    teacherGrossRevenue,
  };
}

/**
 * Calcule fiscalité URSSAF / libératoire + ventilation tripartite pour un cours.
 */
export function computeCoursePaymentBreakdown(input: {
  totalPaidParent: number;
  statusAcre: boolean;
  versementLiberatoire: boolean;
}): TransactionRevenueRecord {
  const split = computeTripartiteRevenueSplit(input.totalPaidParent);
  const fiscal = calculateFiscalBreakdown({
    amountGross: split.totalPaidParent,
    statusAcre: input.statusAcre,
    versementLiberatoire: input.versementLiberatoire,
  });

  return buildTransactionRevenueRecord(fiscal);
}

/** À partir du résultat `prepareBooking().fiscal` (cotisations déjà agrégées). */
export function buildTransactionRevenueFromBooking(fiscal: {
  amountGross: number;
  commissionSasu: number;
  taxesUrssaf: number;
  netPayout: number;
}): TransactionRevenueRecord {
  const split = computeTripartiteRevenueSplit(fiscal.amountGross);

  return {
    ...split,
    amountGross: split.totalPaidParent,
    commissionSasu: split.platformCommission,
    taxesUrssaf: round2(fiscal.taxesUrssaf),
    netPayout: fiscal.netPayout,
  };
}

export function buildTransactionRevenueRecord(
  fiscal: FiscalCalculateResult,
): TransactionRevenueRecord {
  const split = computeTripartiteRevenueSplit(fiscal.amountGross);

  return {
    ...split,
    amountGross: split.totalPaidParent,
    commissionSasu: split.platformCommission,
    taxesUrssaf: round2(fiscal.taxesUrssaf + fiscal.taxesLiberatoire),
    netPayout: fiscal.netPayout,
  };
}

/** Payload Supabase `transactions` (colonnes historiques + tripartite). */
export function toTransactionInsertRow(
  record: TransactionRevenueRecord,
  extras: {
    course_id: string;
    status_stripe?: string;
    status_urssaf?: string;
    stripe_payment_intent_id?: string | null;
    payment_channel?: "stripe" | "urssaf";
    prof_payout_status?:
      | "pending_session_confirmation"
      | "pending_urssaf"
      | "paid"
      | "paid_at_booking";
  },
) {
  return {
    course_id: extras.course_id,
    amount_gross: record.amountGross,
    commission_sasu: record.commissionSasu,
    taxes_urssaf: record.taxesUrssaf,
    net_payout: record.netPayout,
    total_paid_parent: record.totalPaidParent,
    platform_commission: record.platformCommission,
    teacher_gross_revenue: record.teacherGrossRevenue,
    status_stripe: extras.status_stripe ?? "pending",
    status_urssaf: extras.status_urssaf ?? "pending",
    ...(extras.payment_channel ? { payment_channel: extras.payment_channel } : {}),
    ...(extras.prof_payout_status
      ? { prof_payout_status: extras.prof_payout_status }
      : {}),
    ...(extras.stripe_payment_intent_id
      ? { stripe_payment_intent_id: extras.stripe_payment_intent_id }
      : {}),
  };
}

function isMissingEnumValueError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("invalid input value for enum") ||
    message.includes("pending_session_confirmation")
  );
}

/**
 * Insert transaction ; si l'enum `pending_session_confirmation` n'existe pas
 * encore (migration 030), retente sans ce statut.
 */
export async function insertTransactionRow(
  record: TransactionRevenueRecord,
  extras: Parameters<typeof toTransactionInsertRow>[1],
): Promise<{ error: { message: string } | null }> {
  const row = toTransactionInsertRow(record, extras);
  const first = await supabaseAdmin.from("transactions").insert(row);
  if (!first.error) return { error: null };

  if (
    extras.prof_payout_status === "pending_session_confirmation" &&
    isMissingEnumValueError(first.error.message)
  ) {
    console.warn(
      "[transactions] pending_session_confirmation indisponible — insert sans statut (appliquez migration 030)",
    );
    const { prof_payout_status: _omit, ...restExtras } = extras;
    const fallback = await supabaseAdmin
      .from("transactions")
      .insert(toTransactionInsertRow(record, restExtras));
    return { error: fallback.error };
  }

  return { error: first.error };
}
