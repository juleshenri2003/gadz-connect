/**
 * Renvoie les e-mails facture (prof + parent) pour une transaction ou un numéro de facture.
 * Usage: pnpm --filter @gadz-connect/api tsx scripts/resend-test-invoices.ts --invoice=GC-STUDENT-2026-000007
 */
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase.js";
import {
  resendParentInvoiceEmail,
  resendProviderInvoiceEmail,
} from "../src/lib/billing/admin-invoices.js";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

async function main() {
  const invoiceNumber = parseArg("invoice");
  const transactionId = parseArg("transaction");

  let query = supabaseAdmin
    .from("payment_invoices")
    .select("id, invoice_number, invoice_type, transaction_id");

  if (invoiceNumber) {
    query = query.eq("invoice_number", invoiceNumber);
  } else if (transactionId) {
    query = query.eq("transaction_id", transactionId);
  } else {
    console.error("Indique --invoice=... ou --transaction=...");
    process.exit(1);
  }

  const { data: invoices, error } = await query;
  if (error) throw error;
  if (!invoices?.length) {
    console.error("Aucune facture trouvée.");
    process.exit(1);
  }

  const txId = invoices[0]!.transaction_id;
  const { data: allForTx } = await supabaseAdmin
    .from("payment_invoices")
    .select("id, invoice_number, invoice_type")
    .eq("transaction_id", txId);

  for (const inv of allForTx ?? []) {
    if (inv.invoice_type === "student") {
      console.log(`Renvoi prof → ${inv.invoice_number} (${inv.id})`);
      const result = await resendProviderInvoiceEmail(inv.id, undefined);
      console.log(result);
    } else if (inv.invoice_type === "parent") {
      console.log(`Renvoi parent → ${inv.invoice_number} (${inv.id})`);
      const result = await resendParentInvoiceEmail(inv.id, undefined);
      console.log(result);
    }
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
