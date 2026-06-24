import type Stripe from "stripe";
import { finalizeBookingSlot } from "./booking.js";
import { notifyPaymentReceived } from "./notification-helpers.js";
import { supabaseAdmin } from "./supabase.js";

export async function confirmBookingAfterPayment(
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true; courseId: string; status: "scheduled" } | { ok: false; error: string }> {
  const courseId = paymentIntent.metadata?.course_id;
  const slotId = paymentIntent.metadata?.slot_id;
  const clientId = paymentIntent.metadata?.client_id;

  if (!courseId) {
    return { ok: false, error: "Paiement sans cours associé" };
  }

  if (paymentIntent.status !== "succeeded") {
    return { ok: false, error: "Paiement non finalisé" };
  }

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select(
      "id, status, slot_id, client_id, provider_id, campus_id, subject, title, scheduled_at",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return { ok: false, error: "Cours introuvable" };
  }

  if (course.status === "scheduled") {
    return { ok: true, courseId, status: "scheduled" };
  }

  if (course.status !== "payment_pending") {
    return { ok: false, error: "Ce cours ne peut pas être confirmé" };
  }

  const wasPending = true;

  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("transactions")
      .update({
        status_stripe: "succeeded",
        stripe_payment_intent_id: paymentIntent.id,
        invoice_status: "pending_invoice",
      })
      .eq("id", existing.id);
  }

  const resolvedSlotId = slotId ?? course.slot_id;
  const resolvedClientId = clientId ?? course.client_id;

  if (resolvedSlotId && resolvedClientId) {
    const slotResult = await finalizeBookingSlot(
      resolvedSlotId as string,
      resolvedClientId as string,
    );
    if (!slotResult.ok) {
      console.error(
        "[booking-payment] créneau indisponible après paiement:",
        slotResult.error,
      );
    }
  }

  await supabaseAdmin
    .from("courses")
    .update({ status: "scheduled" })
    .eq("id", courseId);

  if (wasPending) {
    const amountGross = paymentIntent.amount_received / 100;
    const { data: client } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", resolvedClientId as string)
      .maybeSingle();

    const studentName = client
      ? `${client.first_name} ${client.last_name}`.trim()
      : "Un élève";

    await notifyPaymentReceived({
      providerId: course.provider_id as string,
      clientId: resolvedClientId as string,
      campusId: course.campus_id as string,
      courseId: course.id as string,
      subject: (course.subject as string) ?? (course.title as string),
      scheduledAt: (course.scheduled_at as string) ?? null,
      amountGross,
      studentName,
    });
  }

  return { ok: true, courseId, status: "scheduled" };
}
