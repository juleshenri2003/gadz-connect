import { stripe } from "./stripe.js";
import { notifyRefundProcessed } from "./course-session-notify.js";
import { supabaseAdmin } from "./supabase.js";

export type RefundCourseResult =
  | { ok: true; courseId: string; alreadyRefunded: boolean }
  | { ok: false; error: string };

export async function refundCoursePayment(
  courseId: string,
  reason = "Aucun remplaçant validé à temps.",
): Promise<RefundCourseResult> {
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select(
      "id, status, slot_id, campus_id, scheduled_at, subject, title, client_id, provider_id",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    return { ok: false, error: "Cours introuvable" };
  }

  if (course.status === "cancelled") {
    return { ok: true, courseId, alreadyRefunded: true };
  }

  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select("id, status_stripe, stripe_payment_intent_id")
    .eq("course_id", courseId)
    .maybeSingle();

  if (transaction?.status_stripe === "refunded") {
    await finalizeCancelledCourse(courseId, course.slot_id as string | null);
    return { ok: true, courseId, alreadyRefunded: true };
  }

  const paymentIntentId = transaction?.stripe_payment_intent_id as
    | string
    | null
    | undefined;

  if (paymentIntentId && stripe) {
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reverse_transfer: true,
        refund_application_fee: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur Stripe";
      console.error("[stripe-refund]", courseId, message);
      return { ok: false, error: message };
    }
  } else if (paymentIntentId && !stripe) {
    console.warn(
      "[stripe-refund] Stripe non configuré — marquage remboursé en base seulement",
    );
  }

  if (transaction?.id) {
    await supabaseAdmin
      .from("transactions")
      .update({ status_stripe: "refunded" })
      .eq("id", transaction.id);
  }

  await finalizeCancelledCourse(courseId, course.slot_id as string | null);

  await closeOpenReplacementNotifications(courseId);

  await notifyRefundProcessed(
    {
      id: course.id as string,
      campus_id: course.campus_id as string,
      scheduled_at: course.scheduled_at as string | null,
      subject: course.subject as string | null,
      title: course.title as string,
      client_id: course.client_id as string | null,
      provider_id: course.provider_id as string | null,
    },
    reason,
  );

  return { ok: true, courseId, alreadyRefunded: false };
}

async function finalizeCancelledCourse(
  courseId: string,
  slotId: string | null,
): Promise<void> {
  await supabaseAdmin
    .from("courses")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (slotId) {
    await supabaseAdmin
      .from("tutor_slots")
      .update({ booked: false, booked_by: null })
      .eq("id", slotId);
  }
}

async function closeOpenReplacementNotifications(courseId: string): Promise<void> {
  await supabaseAdmin
    .from("campus_notifications")
    .update({ replacement_status: "dismissed" })
    .eq("course_id", courseId)
    .eq("replacement_status", "open");
}

export async function syncRefundFromStripePaymentIntent(
  paymentIntentId: string,
): Promise<void> {
  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select("id, course_id, status_stripe")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!transaction || transaction.status_stripe === "refunded") return;

  await supabaseAdmin
    .from("transactions")
    .update({ status_stripe: "refunded" })
    .eq("id", transaction.id);

  const courseId = transaction.course_id as string;
  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("id, status, slot_id")
    .eq("id", courseId)
    .maybeSingle();

  if (course && course.status !== "cancelled") {
    await finalizeCancelledCourse(courseId, course.slot_id as string | null);
    await closeOpenReplacementNotifications(courseId);
  }
}
