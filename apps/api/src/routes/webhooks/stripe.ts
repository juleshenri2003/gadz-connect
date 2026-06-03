import { Router } from "express";
import type { Request, Response } from "express";
import type Stripe from "stripe";
import { supabaseAdmin } from "../../lib/supabase.js";
import { stripe, STRIPE_WEBHOOK_SECRET } from "../../lib/stripe.js";

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
  const courseId = paymentIntent.metadata?.course_id;
  if (!courseId || !paymentIntent.amount_received) return;

  const amountGross = paymentIntent.amount_received / 100;

  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("transactions")
      .update({ status_stripe: "succeeded" })
      .eq("id", existing.id);
    return;
  }

  // Les montants détaillés sont calculés côté API fiscal lors de la création
  await supabaseAdmin.from("transactions").insert({
    course_id: courseId,
    amount_gross: amountGross,
    commission_sasu: 5,
    taxes_urssaf: 0,
    net_payout: 0,
    status_stripe: "succeeded",
    status_urssaf: "pending",
  });
}

/**
 * POST /api/webhooks/stripe
 * Corps brut requis pour la vérification de signature Stripe.
 */
stripeWebhookRouter.post("/", async (req: Request, res: Response) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
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
