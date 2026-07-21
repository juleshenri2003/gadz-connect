import { stripe } from "../stripe.js";
import { supabaseAdmin } from "../supabase.js";
import { triggerPaymentInvoicesForCourse } from "../billing/trigger-payment-invoices.js";
import {
  notifyUrssafPaymentRejected,
  notifyUrssafPayoutPending,
} from "../notification-helpers.js";
import { transmettreDemandePaiement } from "./demande-paiement.js";
import { consulterDemandePaiement } from "./consulter-demande.js";
import { getUrssafClientByProfileId } from "./enrollment.js";
import { isUrssafApiOperational } from "./config.js";
import type { UrssafPaymentStatus } from "@gadz-connect/types";

type TransactionRow = {
  id: string;
  course_id: string;
  amount_gross: number;
  net_payout: number;
  teacher_gross_revenue: number | null;
  urssaf_payment_request_id: string | null;
  urssaf_payment_status: UrssafPaymentStatus | null;
  prof_payout_status: string | null;
  payment_channel: string;
};

type CourseRow = {
  id: string;
  client_id: string | null;
  provider_id: string | null;
  subject: string | null;
  title: string;
  scheduled_at: string | null;
  payment_method: string | null;
  status: string;
};

/** Déclenche une demande de paiement URSSAF après complétion du cours. */
export async function triggerUrssafPaymentForCourse(
  courseId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isUrssafApiOperational()) {
    return { ok: false, error: "API URSSAF non opérationnelle" };
  }

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select(
      "id, client_id, provider_id, subject, title, scheduled_at, payment_method, status",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return { ok: false, error: "Cours introuvable" };
  const courseRow = course as CourseRow;

  if (courseRow.payment_method !== "urssaf") {
    return { ok: false, error: "Ce cours n'utilise pas l'avance immédiate" };
  }
  if (courseRow.status !== "completed") {
    return { ok: false, error: "Le cours n'est pas terminé" };
  }

  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, course_id, amount_gross, net_payout, teacher_gross_revenue, urssaf_payment_request_id, urssaf_payment_status, prof_payout_status, payment_channel",
    )
    .eq("course_id", courseId)
    .maybeSingle();

  if (!transaction) return { ok: false, error: "Transaction introuvable" };
  const tx = transaction as TransactionRow;

  if (tx.payment_channel !== "urssaf") {
    return { ok: false, error: "Transaction non URSSAF" };
  }
  if (tx.urssaf_payment_request_id) {
    return { ok: true };
  }

  const clientId = courseRow.client_id;
  if (!clientId) return { ok: false, error: "Payeur introuvable" };

  const urssafClient = await getUrssafClientByProfileId(clientId);
  if (!urssafClient?.urssaf_client_id || urssafClient.status !== "actif") {
    return { ok: false, error: "Client URSSAF non actif" };
  }

  try {
    const result = await transmettreDemandePaiement({
      profileId: clientId,
      courseId,
      transactionId: tx.id,
      urssafClientId: urssafClient.urssaf_client_id,
      amountEur: Number(tx.amount_gross),
      serviceDate: (courseRow.scheduled_at ?? new Date().toISOString()).slice(
        0,
        10,
      ),
      description:
        courseRow.subject ?? courseRow.title ?? "Cours de soutien scolaire",
    });

    await supabaseAdmin
      .from("transactions")
      .update({
        urssaf_payment_request_id: result.paymentRequestId,
        urssaf_transmission_id: result.transmissionId,
        urssaf_payment_status: result.status,
      })
      .eq("id", tx.id);

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur URSSAF",
    };
  }
}

/** Polling des demandes de paiement en cours + reversement prof. */
export async function pollUrssafPayments(): Promise<{
  polled: number;
  paid: number;
  rejected: number;
  profPayoutsTriggered: number;
  errors: string[];
}> {
  const stats = {
    polled: 0,
    paid: 0,
    rejected: 0,
    profPayoutsTriggered: 0,
    errors: [] as string[],
  };

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, course_id, amount_gross, net_payout, teacher_gross_revenue, urssaf_payment_request_id, urssaf_payment_status, prof_payout_status, payment_channel",
    )
    .eq("payment_channel", "urssaf")
    .not("urssaf_payment_request_id", "is", null);

  if (error) {
    stats.errors.push(error.message);
    return stats;
  }

  const terminal: UrssafPaymentStatus[] = ["paye", "rejetee"];

  for (const row of (data ?? []) as TransactionRow[]) {
    if (!row.urssaf_payment_request_id) continue;
    if (row.urssaf_payment_status && terminal.includes(row.urssaf_payment_status)) {
      continue;
    }
    stats.polled += 1;

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, client_id, provider_id, campus_id, subject, title")
      .eq("id", row.course_id)
      .maybeSingle();

    try {
      const result = await consulterDemandePaiement(
        row.urssaf_payment_request_id,
        {
          profileId: (course?.client_id as string | null) ?? undefined,
          courseId: row.course_id,
          transactionId: row.id,
        },
      );

      const updates: Record<string, unknown> = {
        urssaf_payment_status: result.status,
      };
      if (result.status === "paye") {
        updates.urssaf_paid_at = result.paidAt ?? new Date().toISOString();
        stats.paid += 1;
      }

      await supabaseAdmin
        .from("transactions")
        .update(updates)
        .eq("id", row.id);

      if (result.status === "paye" && row.prof_payout_status === "pending_urssaf") {
        const payoutOk = await triggerProfPayoutAfterUrssaf(row, course);
        if (payoutOk) stats.profPayoutsTriggered += 1;
      }

      if (result.status === "rejetee") {
        stats.rejected += 1;
        await handleUrssafPaymentRejection(row, course);
      }
    } catch (err) {
      stats.errors.push(
        `tx ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return stats;
}

async function triggerProfPayoutAfterUrssaf(
  tx: TransactionRow,
  course: { provider_id: string | null; client_id?: string | null } | null,
): Promise<boolean> {
  if (!stripe || !course?.provider_id) return false;

  const { data: provider } = await supabaseAdmin
    .from("profiles")
    .select(
      "stripe_connect_account_id, stripe_connect_onboarding_complete, campus_id",
    )
    .eq("id", course.provider_id)
    .maybeSingle();

  const accountId = provider?.stripe_connect_account_id as string | null;
  if (!accountId || !provider?.stripe_connect_onboarding_complete) {
    console.error(
      `[urssaf] prof ${course.provider_id} sans Connect — reversement en attente`,
    );
    const campusId = provider?.campus_id as string | undefined;
    if (campusId) {
      const { data: courseRow } = await supabaseAdmin
        .from("courses")
        .select("subject, title")
        .eq("id", tx.course_id)
        .maybeSingle();
      await notifyUrssafPayoutPending({
        campusId,
        courseId: tx.course_id,
        providerId: course.provider_id,
        subject:
          (courseRow?.subject as string | null) ??
          (courseRow?.title as string | null) ??
          "Cours",
        amountGross: Number(tx.amount_gross),
        declaredBy: course.client_id ?? course.provider_id,
      });
    }
    return false;
  }

  const amountCents = Math.round(
    Number(tx.teacher_gross_revenue ?? tx.net_payout) * 100,
  );
  if (amountCents <= 0) return false;

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "eur",
    destination: accountId,
    metadata: {
      course_id: tx.course_id,
      transaction_id: tx.id,
      source: "urssaf_avance_immediate",
    },
  });

  await supabaseAdmin
    .from("transactions")
    .update({
      prof_payout_status: "paid",
      prof_payout_transfer_id: transfer.id,
      status_stripe: "succeeded",
    })
    .eq("id", tx.id);

  await triggerPaymentInvoicesForCourse(tx.course_id);
  return true;
}

/** Repli Stripe 100 % si le parent refuse la demande URSSAF. */
async function handleUrssafPaymentRejection(
  tx: TransactionRow,
  course: {
    client_id: string | null;
    id: string;
    campus_id?: string | null;
    subject?: string | null;
    title?: string | null;
  } | null,
): Promise<void> {
  if (!stripe || !course?.client_id) return;

  const amountCents = Math.round(Number(tx.amount_gross) * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    metadata: {
      course_id: tx.course_id,
      client_id: course.client_id,
      urssaf_fallback: "true",
    },
    automatic_payment_methods: { enabled: true },
  });

  await supabaseAdmin
    .from("transactions")
    .update({
      payment_channel: "stripe",
      stripe_payment_intent_id: paymentIntent.id,
      status_stripe: "pending",
      prof_payout_status: null,
      urssaf_payment_status: "rejetee",
    })
    .eq("id", tx.id);

  let campusId = course.campus_id ?? null;
  if (!campusId) {
    const { data: courseRow } = await supabaseAdmin
      .from("courses")
      .select("campus_id, subject, title")
      .eq("id", tx.course_id)
      .maybeSingle();
    campusId = (courseRow?.campus_id as string | null) ?? null;
    course = {
      ...course,
      subject: (courseRow?.subject as string | null) ?? course.subject,
      title: (courseRow?.title as string | null) ?? course.title,
    };
  }

  if (campusId && course.client_id) {
    await notifyUrssafPaymentRejected({
      clientId: course.client_id,
      campusId,
      courseId: tx.course_id,
      subject: course.subject ?? course.title ?? "Cours",
      amountGross: Number(tx.amount_gross),
    });
  }

  console.warn(
    `[urssaf] rejet cours ${tx.course_id} — PI fallback ${paymentIntent.id}`,
  );
}
