/**
 * Facturation mensuelle regroupée — à exécuter le 1er de chaque mois.
 * Usage:
 *   pnpm --filter @gadz-connect/api monthly-billing
 *   pnpm --filter @gadz-connect/api monthly-billing -- --period=2026-05
 *   pnpm --filter @gadz-connect/api monthly-billing -- --dry-run
 */
import "dotenv/config";
import { runMonthlyBilling } from "../src/lib/billing/run-monthly-billing.js";

function parseArgs(argv: string[]) {
  let period: string | undefined;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--period=")) {
      period = arg.slice("--period=".length);
    }
  }

  return { period, dryRun };
}

async function main() {
  const { period, dryRun } = parseArgs(process.argv.slice(2));
  const result = await runMonthlyBilling({ period, dryRun });

  console.log("");
  console.log("── Résultat facturation mensuelle ──");
  console.log(`  Période           : ${result.period}`);
  console.log(`  Factures parents  : ${result.parentInvoices}`);
  console.log(`  Notes étudiants   : ${result.studentInvoices}`);
  console.log(`  Lignes facturées  : ${result.linesInvoiced}`);
  console.log(`  E-mails envoyés   : ${result.emailsSent}`);
  console.log(`  Déjà existantes   : ${result.skippedExisting}`);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
