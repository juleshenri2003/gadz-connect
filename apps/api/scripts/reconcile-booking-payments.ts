/**
 * Passe en "scheduled" les cours payment_pending dont le PaymentIntent Stripe a réussi.
 * Usage: pnpm --filter @gadz-connect/api reconcile-booking-payments
 */
import "dotenv/config";
import { confirmBookingAfterPayment } from "../src/lib/booking-payment.js";
import { stripe } from "../src/lib/stripe.js";
import { supabaseAdmin } from "../src/lib/supabase.js";

async function main() {
  if (!stripe) {
    console.error("Stripe non configuré");
    process.exit(1);
  }

  const { data: pending } = await supabaseAdmin
    .from("courses")
    .select("id, subject, scheduled_at")
    .eq("status", "payment_pending");

  if (!pending?.length) {
    console.log("Aucun cours payment_pending.");
    return;
  }

  let confirmed = 0;
  for (const course of pending) {
    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("stripe_payment_intent_id")
      .eq("course_id", course.id)
      .maybeSingle();

    const piId = tx?.stripe_payment_intent_id as string | undefined;
    if (!piId) {
      console.log(`— ${course.id} : pas de PaymentIntent`);
      continue;
    }

    const pi = await stripe.paymentIntents.retrieve(piId);
    if (pi.status !== "succeeded") {
      console.log(`— ${course.id} : PI ${pi.status}`);
      continue;
    }

    const result = await confirmBookingAfterPayment(pi);
    if (result.ok) {
      confirmed += 1;
      console.log(`✓ ${course.subject ?? "cours"} @ ${course.scheduled_at}`);
    } else {
      console.log(`✗ ${course.id} : ${result.error}`);
    }
  }

  console.log(`\n${confirmed} cours confirmé(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
