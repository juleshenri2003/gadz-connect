import type { ProfPayoutStatus } from "@gadz-connect/types";
import { stripe } from "../stripe.js";
import { supabaseAdmin } from "../supabase.js";
import { triggerPaymentInvoicesForCourse } from "./trigger-payment-invoices.js";
import { triggerUrssafPaymentForCourse } from "../urssaf/payment.js";
import {
  notifySessionBothConfirmed,
} from "../notification-helpers.js";

export type SessionPayoutResult =
  | { ok: true; channel: "stripe" | "urssaf"; transferId?: string }
  | { ok: false; error: string };

/**
 * Après double confirmation post-séance :
 * - Stripe : Transfer Connect du montant prof (fonds déjà sur la plateforme)
 * - URSSAF : déclenche la demande de paiement (Transfer après statut paye)
 */
export async function payoutAfterSessionConfirmation(
  courseId: string,
): Promise<SessionPayoutResult> {
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select(
      "id, status, campus_id, client_id, provider_id, subject, title, payment_method, session_confirmation_completed_at, student_session_confirmed_at, provider_session_confirmed_at",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    return { ok: false, error: courseError?.message ?? "Cours introuvable" };
  }

  if (
    !course.student_session_confirmed_at ||
    !course.provider_session_confirmed_at
  ) {
    return {
      ok: false,
      error: "Les deux parties doivent confirmer que le cours a eu lieu",
    };
  }

  const { data: tx, error: txError } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, amount_gross, net_payout, teacher_gross_revenue, payment_channel, prof_payout_status, status_stripe",
    )
    .eq("course_id", courseId)
    .maybeSingle();

  if (txError || !tx) {
    return { ok: false, error: txError?.message ?? "Transaction introuvable" };
  }

  const payoutStatus = tx.prof_payout_status as ProfPayoutStatus | null;
  if (payoutStatus === "paid" || payoutStatus === "paid_at_booking") {
    return { ok: true, channel: (tx.payment_channel as "stripe" | "urssaf") ?? "stripe" };
  }

  const now = new Date().toISOString();
  if (!course.session_confirmation_completed_at) {
    await supabaseAdmin
      .from("courses")
      .update({
        session_confirmation_completed_at: now,
        status: "completed",
        session_dispute_status: "none",
      })
      .eq("id", courseId);
  } else if (course.status === "awaiting_session_confirmation") {
    await supabaseAdmin
      .from("courses")
      .update({ status: "completed", session_dispute_status: "none" })
      .eq("id", courseId);
  }

  const channel = (tx.payment_channel as string) ?? course.payment_method ?? "stripe";

  if (course.campus_id && course.client_id && course.provider_id) {
    await notifySessionBothConfirmed({
      campusId: course.campus_id as string,
      courseId,
      clientId: course.client_id as string,
      providerId: course.provider_id as string,
      subject:
        (course.subject as string | null) ??
        (course.title as string | null) ??
        "Cours",
      declaredBy: course.provider_id as string,
    });
  }

  if (channel === "urssaf") {
    await supabaseAdmin
      .from("transactions")
      .update({ prof_payout_status: "pending_urssaf" })
      .eq("id", tx.id);

    const urssaf = await triggerUrssafPaymentForCourse(courseId);
    if (!urssaf.ok) {
      return { ok: false, error: urssaf.error ?? "Échec demande URSSAF" };
    }
    return { ok: true, channel: "urssaf" };
  }

  return transferStripePayoutToTeacher({
    courseId,
    transactionId: tx.id as string,
    providerId: course.provider_id as string,
    teacherGrossRevenue: Number(
      tx.teacher_gross_revenue ?? tx.net_payout ?? 0,
    ),
  });
}

export async function transferStripePayoutToTeacher(input: {
  courseId: string;
  transactionId: string;
  providerId: string;
  teacherGrossRevenue: number;
}): Promise<SessionPayoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe non configuré" };
  }

  const { data: provider } = await supabaseAdmin
    .from("profiles")
    .select(
      "stripe_connect_account_id, stripe_connect_onboarding_complete",
    )
    .eq("id", input.providerId)
    .maybeSingle();

  const accountId = provider?.stripe_connect_account_id as string | null;
  if (!accountId || !provider?.stripe_connect_onboarding_complete) {
    return {
      ok: false,
      error:
        "Le professeur n'a pas finalisé Stripe Connect — reversement en attente",
    };
  }

  const amountCents = Math.round(Math.max(0, input.teacherGrossRevenue) * 100);
  if (amountCents <= 0) {
    return { ok: false, error: "Montant de reversement invalide" };
  }

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "eur",
    destination: accountId,
    metadata: {
      course_id: input.courseId,
      transaction_id: input.transactionId,
      source: "session_confirmation",
    },
  });

  await supabaseAdmin
    .from("transactions")
    .update({
      prof_payout_status: "paid",
      prof_payout_transfer_id: transfer.id,
      status_stripe: "succeeded",
    })
    .eq("id", input.transactionId);

  await triggerPaymentInvoicesForCourse(input.courseId);
  return { ok: true, channel: "stripe", transferId: transfer.id };
}

/** Admin : force les deux confirmations puis déclenche le payout. */
export async function adminForceSessionConfirmation(
  courseId: string,
): Promise<SessionPayoutResult> {
  const now = new Date().toISOString();
  const { data: course } = await supabaseAdmin
    .from("courses")
    .select(
      "id, student_session_confirmed_at, provider_session_confirmed_at",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return { ok: false, error: "Cours introuvable" };

  await supabaseAdmin
    .from("courses")
    .update({
      student_session_confirmed_at:
        course.student_session_confirmed_at ?? now,
      provider_session_confirmed_at:
        course.provider_session_confirmed_at ?? now,
      session_confirmation_completed_at: now,
      status: "completed",
      session_dispute_status: "resolved_paid",
    })
    .eq("id", courseId);

  return payoutAfterSessionConfirmation(courseId);
}
