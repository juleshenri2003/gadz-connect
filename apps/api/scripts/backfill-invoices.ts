/**
 * Génère les factures manquantes pour les transactions Stripe déjà réussies.
 * Usage: pnpm --filter @gadz-connect/api backfill-invoices
 */
import "dotenv/config";
import { generatePaymentInvoices } from "../src/lib/billing/generate-payment-invoices.js";
import { supabaseAdmin } from "../src/lib/supabase.js";

async function main() {
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

  if (missing.length === 0) {
    console.log("Aucune facture à générer — toutes les transactions sont à jour.");
    return;
  }

  console.log(`${missing.length} transaction(s) sans facture — génération…`);

  let ok = 0;
  let failed = 0;

  for (const tx of missing) {
    const paymentIntentId =
      (tx.stripe_payment_intent_id as string | null) ?? `backfill-${tx.id}`;

    try {
      const result = await generatePaymentInvoices({
        transactionId: tx.id as string,
        courseId: tx.course_id as string,
        paymentIntentId,
      });
      ok += 1;
      console.log(
        `✓ ${tx.id} → parent=${result.parentInvoiceId ?? "—"} student=${result.studentInvoiceId ?? "—"}`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `✗ ${tx.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`Terminé : ${ok} OK, ${failed} échec(s).`);
  if (failed > 0) process.exit(1);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
