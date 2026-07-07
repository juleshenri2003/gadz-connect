/**
 * Jobs planifiés : rappels 24 h, escalade confirmations, remboursements remplacement.
 * Usage: pnpm --filter @gadz-connect/api course-session-jobs
 */
import "dotenv/config";
import { runCourseSessionJobs } from "../src/lib/course-session-jobs.js";

async function main() {
  const stats = await runCourseSessionJobs();
  console.log("── Course session jobs ──");
  console.log(`Rappels 24 h envoyés : ${stats.remindersSent}`);
  console.log(`Escalades admin       : ${stats.escalationsSent}`);
  console.log(`Remboursements auto   : ${stats.replacementsRefunded}`);
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
