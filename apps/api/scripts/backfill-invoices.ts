/**
 * Lance la facturation mensuelle (mois précédent par défaut).
 * Usage: pnpm --filter @gadz-connect/api backfill-invoices
 *        pnpm --filter @gadz-connect/api backfill-invoices -- --period=2026-05
 */
import "dotenv/config";
import { runMonthlyBilling } from "../src/lib/billing/run-monthly-billing.js";

function parsePeriod(argv: string[]): string | undefined {
  for (const arg of argv) {
    if (arg.startsWith("--period=")) return arg.slice("--period=".length);
  }
  return undefined;
}

async function main() {
  const period = parsePeriod(process.argv.slice(2));
  const result = await runMonthlyBilling({ period });

  if (
    result.parentInvoices === 0 &&
    result.studentInvoices === 0 &&
    result.linesInvoiced === 0
  ) {
    console.log("Aucune ligne en attente pour cette période.");
    return;
  }

  console.log(
    `Terminé : ${result.parentInvoices} facture(s) parent, ${result.studentInvoices} note(s) étudiant, ${result.linesInvoiced} ligne(s) clôturée(s).`,
  );
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
