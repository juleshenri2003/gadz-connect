/**
 * Polling URSSAF : rattachement clients + statuts demandes de paiement.
 * Usage: pnpm --filter @gadz-connect/api urssaf-polling
 */
import "dotenv/config";
import { runUrssafPollingJobs } from "../src/lib/urssaf/polling.js";
import { markPastCoursesCompleted } from "../src/lib/course-completion.js";

async function main() {
  await markPastCoursesCompleted();
  const stats = await runUrssafPollingJobs();
  console.log("── URSSAF polling ──");
  console.log(`Clients interrogés    : ${stats.clientsPolled}`);
  console.log(`Clients activés       : ${stats.clientsActivated}`);
  console.log(`Paiements interrogés  : ${stats.paymentsPolled}`);
  console.log(`Paiements soldés      : ${stats.paymentsPaid}`);
  console.log(`Paiements rejetés     : ${stats.paymentsRejected}`);
  console.log(`Reversements prof     : ${stats.profPayoutsTriggered}`);
  if (stats.errors.length > 0) {
    console.error("Erreurs :");
    for (const err of stats.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
