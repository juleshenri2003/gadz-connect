import type { GeneratePaymentInvoicesInput } from "./generate-payment-invoices.js";
import { generatePaymentInvoices } from "./generate-payment-invoices.js";
import { INVOICES_BUCKET } from "./invoice-storage.js";
import { supabaseAdmin } from "../supabase.js";

/**
 * Supprime les factures existantes d'une transaction et les régénère.
 */
export async function regeneratePaymentInvoices(
  input: GeneratePaymentInvoicesInput,
): Promise<Awaited<ReturnType<typeof generatePaymentInvoices>>> {
  const { data: existing, error } = await supabaseAdmin
    .from("payment_invoices")
    .select("id, storage_path")
    .eq("transaction_id", input.transactionId);

  if (error) {
    throw new Error(error.message);
  }

  const storagePaths = (existing ?? [])
    .map((row) => row.storage_path as string)
    .filter(Boolean);

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(INVOICES_BUCKET)
      .remove(storagePaths);
    if (storageError) {
      console.warn("[billing] suppression PDF:", storageError.message);
    }
  }

  if ((existing ?? []).length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from("payment_invoices")
      .delete()
      .eq("transaction_id", input.transactionId);
    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  return generatePaymentInvoices(input);
}

export async function backfillMissingPaymentInvoices(): Promise<{
  ok: number;
  failed: number;
}> {
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("id, course_id, stripe_payment_intent_id, status_stripe")
    .eq("status_stripe", "succeeded");

  if (error) {
    throw new Error(error.message);
  }

  const { data: invoices } = await supabaseAdmin
    .from("payment_invoices")
    .select("transaction_id, invoice_type");

  const invoiceCount = new Map<string, number>();
  for (const row of invoices ?? []) {
    const txId = row.transaction_id as string;
    invoiceCount.set(txId, (invoiceCount.get(txId) ?? 0) + 1);
  }

  const missing = (transactions ?? []).filter(
    (tx) => (invoiceCount.get(tx.id as string) ?? 0) < 2,
  );

  let ok = 0;
  let failed = 0;

  for (const tx of missing) {
    const paymentIntentId =
      (tx.stripe_payment_intent_id as string | null) ?? `backfill-${tx.id}`;
    try {
      await generatePaymentInvoices({
        transactionId: tx.id as string,
        courseId: tx.course_id as string,
        paymentIntentId,
      });
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  return { ok, failed };
}
