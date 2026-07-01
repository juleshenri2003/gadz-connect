/**
 * Lance les relevés mensuels (mois précédent par défaut).
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
    result.parentSummaries === 0 &&
    result.providerSummaries === 0 &&
    result.linesIncluded === 0
  ) {
    console.log("Aucune facture par cours pour cette période.");
    return;
  }

  console.log(
    `Terminé : ${result.parentSummaries} relevé(s) parent, ${result.providerSummaries} relevé(s) prof, ${result.linesIncluded} ligne(s) incluse(s).`,
  );
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
