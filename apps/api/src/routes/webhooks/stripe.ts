import { Router } from "express";
import type { Request, Response } from "express";
import type Stripe from "stripe";
import {
  cancelPendingBooking,
} from "../../lib/booking.js";
import { confirmBookingAfterPayment } from "../../lib/booking-payment.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import {
  isStripeWebhookConfigured,
  stripe,
  STRIPE_WEBHOOK_SECRET,
} from "../../lib/stripe.js";

export const stripeWebhookRouter = Router();

async function handleAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.gadz_user_id;
  if (!userId) return;

  const onboardingComplete = Boolean(
    account.charges_enabled && account.payouts_enabled,
  );

  await supabaseAdmin
    .from("profiles")
    .update({
      stripe_connect_onboarding_complete: onboardingComplete,
      stripe_connect_account_id: account.id,
    })
    .eq("id", userId);
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const result = await confirmBookingAfterPayment(paymentIntent);
  if (!result.ok) {
    console.error("[stripe webhook] confirmation:", result.error);
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
) {
  const courseId = paymentIntent.metadata?.course_id;
  if (!courseId) return;

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("id, status")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.status !== "payment_pending") return;

  await supabaseAdmin
    .from("transactions")
    .update({ status_stripe: "failed" })
    .eq("course_id", courseId);

  await cancelPendingBooking(courseId);
}

/**
 * POST /api/webhooks/stripe
 * Corps brut requis pour la vérification de signature Stripe.
 */
stripeWebhookRouter.post("/", async (req: Request, res: Response) => {
  if (!stripe || !isStripeWebhookConfigured()) {
    res.status(503).send("Stripe webhook non configuré");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).send("Signature Stripe manquante");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature error:", message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        console.info(`[stripe webhook] événement ignoré: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    res.status(500).send("Handler error");
    return;
  }

  res.json({ received: true });
});
