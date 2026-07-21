import { supabaseAdmin } from "../supabase.js";

export type UrssafAnomalyKind =
  | "pending_payout"
  | "rejected_fallback"
  | "stuck_payment"
  | "awaiting_request"
  | "ok";

export interface UrssafReconciliationRow {
  transactionId: string;
  courseId: string;
  anomaly: UrssafAnomalyKind;
  amountGross: number;
  paymentChannel: string | null;
  urssafPaymentStatus: string | null;
  urssafPaymentRequestId: string | null;
  urssafPaidAt: string | null;
  profPayoutStatus: string | null;
  profPayoutTransferId: string | null;
  stripePaymentIntentId: string | null;
  courseSubject: string | null;
  courseStatus: string | null;
  scheduledAt: string | null;
  campusId: string | null;
  campusName: string | null;
  clientName: string | null;
  providerName: string | null;
  createdAt: string;
}

export interface UrssafReconciliationSummary {
  total: number;
  pendingPayout: number;
  rejectedFallback: number;
  stuckPayment: number;
  awaitingRequest: number;
  ok: number;
}

export interface UrssafReconciliationResult {
  summary: UrssafReconciliationSummary;
  anomalies: UrssafReconciliationRow[];
  rows: UrssafReconciliationRow[];
}

const STUCK_HOURS = 72;
const TERMINAL = new Set(["paye", "rejetee"]);

function classifyAnomaly(input: {
  paymentChannel: string | null;
  urssafPaymentStatus: string | null;
  urssafPaymentRequestId: string | null;
  profPayoutStatus: string | null;
  courseStatus: string | null;
  createdAt: string;
  urssafPaidAt: string | null;
}): UrssafAnomalyKind {
  if (input.urssafPaymentStatus === "rejetee") {
    return "rejected_fallback";
  }

  if (
    input.urssafPaymentStatus === "paye" &&
    input.profPayoutStatus === "pending_urssaf"
  ) {
    return "pending_payout";
  }

  if (
    input.paymentChannel === "urssaf" &&
    input.courseStatus === "completed" &&
    !input.urssafPaymentRequestId
  ) {
    return "awaiting_request";
  }

  if (
    input.paymentChannel === "urssaf" &&
    input.urssafPaymentStatus &&
    !TERMINAL.has(input.urssafPaymentStatus)
  ) {
    const ref = input.urssafPaidAt ?? input.createdAt;
    const ageMs = Date.now() - new Date(ref).getTime();
    if (ageMs > STUCK_HOURS * 60 * 60 * 1000) {
      return "stuck_payment";
    }
  }

  return "ok";
}

function personName(
  row: { first_name?: string | null; last_name?: string | null } | null,
): string | null {
  if (!row) return null;
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return name || null;
}

export async function fetchUrssafReconciliation(
  scopeCampusId?: string | null,
): Promise<UrssafReconciliationResult> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select(
      `
      id,
      course_id,
      amount_gross,
      payment_channel,
      urssaf_payment_status,
      urssaf_payment_request_id,
      urssaf_paid_at,
      prof_payout_status,
      prof_payout_transfer_id,
      stripe_payment_intent_id,
      created_at,
      courses!inner (
        id,
        status,
        subject,
        title,
        scheduled_at,
        campus_id,
        client_id,
        provider_id,
        campus:campus_id ( id, name ),
        client:client_id ( first_name, last_name ),
        provider:provider_id ( first_name, last_name )
      )
    `,
    )
    .or("payment_channel.eq.urssaf,urssaf_payment_status.not.is.null")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const rows: UrssafReconciliationRow[] = [];

  for (const raw of data ?? []) {
    const course = raw.courses as unknown as {
      id: string;
      status: string | null;
      subject: string | null;
      title: string | null;
      scheduled_at: string | null;
      campus_id: string | null;
      campus: { id: string; name: string } | { id: string; name: string }[] | null;
      client: { first_name: string; last_name: string } | null;
      provider: { first_name: string; last_name: string } | null;
    };

    const campus = Array.isArray(course.campus)
      ? course.campus[0]
      : course.campus;

    if (scopeCampusId && course.campus_id !== scopeCampusId) {
      continue;
    }

    const anomaly = classifyAnomaly({
      paymentChannel: (raw.payment_channel as string | null) ?? null,
      urssafPaymentStatus:
        (raw.urssaf_payment_status as string | null) ?? null,
      urssafPaymentRequestId:
        (raw.urssaf_payment_request_id as string | null) ?? null,
      profPayoutStatus: (raw.prof_payout_status as string | null) ?? null,
      courseStatus: course.status,
      createdAt: raw.created_at as string,
      urssafPaidAt: (raw.urssaf_paid_at as string | null) ?? null,
    });

    rows.push({
      transactionId: raw.id as string,
      courseId: raw.course_id as string,
      anomaly,
      amountGross: Number(raw.amount_gross),
      paymentChannel: (raw.payment_channel as string | null) ?? null,
      urssafPaymentStatus:
        (raw.urssaf_payment_status as string | null) ?? null,
      urssafPaymentRequestId:
        (raw.urssaf_payment_request_id as string | null) ?? null,
      urssafPaidAt: (raw.urssaf_paid_at as string | null) ?? null,
      profPayoutStatus: (raw.prof_payout_status as string | null) ?? null,
      profPayoutTransferId:
        (raw.prof_payout_transfer_id as string | null) ?? null,
      stripePaymentIntentId:
        (raw.stripe_payment_intent_id as string | null) ?? null,
      courseSubject: course.subject ?? course.title,
      courseStatus: course.status,
      scheduledAt: course.scheduled_at,
      campusId: course.campus_id,
      campusName: campus?.name ?? null,
      clientName: personName(course.client),
      providerName: personName(course.provider),
      createdAt: raw.created_at as string,
    });
  }

  const anomalies = rows.filter((r) => r.anomaly !== "ok");

  const summary: UrssafReconciliationSummary = {
    total: rows.length,
    pendingPayout: rows.filter((r) => r.anomaly === "pending_payout").length,
    rejectedFallback: rows.filter((r) => r.anomaly === "rejected_fallback")
      .length,
    stuckPayment: rows.filter((r) => r.anomaly === "stuck_payment").length,
    awaitingRequest: rows.filter((r) => r.anomaly === "awaiting_request")
      .length,
    ok: rows.filter((r) => r.anomaly === "ok").length,
  };

  return { summary, anomalies, rows };
}

export function exportUrssafReconciliationCsv(
  rows: UrssafReconciliationRow[],
): string {
  const header = [
    "anomaly",
    "transaction_id",
    "course_id",
    "amount_gross",
    "payment_channel",
    "urssaf_payment_status",
    "urssaf_payment_request_id",
    "urssaf_paid_at",
    "prof_payout_status",
    "prof_payout_transfer_id",
    "stripe_payment_intent_id",
    "course_subject",
    "course_status",
    "scheduled_at",
    "campus",
    "client",
    "provider",
    "created_at",
  ];

  const escape = (value: string | number | null | undefined) => {
    const str = value == null ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.anomaly,
        row.transactionId,
        row.courseId,
        row.amountGross,
        row.paymentChannel,
        row.urssafPaymentStatus,
        row.urssafPaymentRequestId,
        row.urssafPaidAt,
        row.profPayoutStatus,
        row.profPayoutTransferId,
        row.stripePaymentIntentId,
        row.courseSubject,
        row.courseStatus,
        row.scheduledAt,
        row.campusName,
        row.clientName,
        row.providerName,
        row.createdAt,
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}
