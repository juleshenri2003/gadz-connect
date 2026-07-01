import { generatePaymentInvoices } from "./generate-payment-invoices.js";
import { supabaseAdmin } from "../supabase.js";

/**
 * Génère les factures (parent + prof) après un paiement confirmé.
 * Idempotent — ignore si les deux factures existent déjà.
 */
export async function triggerPaymentInvoicesForCourse(
  courseId: string,
): Promise<void> {
  const { data: transaction, error } = await supabaseAdmin
    .from("transactions")
    .select("id, stripe_payment_intent_id, status_stripe")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !transaction) {
    console.warn(
      "[billing] trigger invoices — transaction introuvable pour cours",
      courseId,
    );
    return;
  }

  if (transaction.status_stripe !== "succeeded") {
    return;
  }

  try {
    await generatePaymentInvoices({
      transactionId: transaction.id as string,
      courseId,
      paymentIntentId:
        (transaction.stripe_payment_intent_id as string | null) ??
        `auto-${transaction.id}`,
    });
  } catch (err) {
    console.error(
      "[billing] trigger invoices:",
      err instanceof Error ? err.message : err,
    );
  }
}
