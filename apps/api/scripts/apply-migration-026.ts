/**
 * Applique la migration 026 (confirmations 24 h, remplacement, remboursements).
 * Usage: pnpm --filter @gadz-connect/api apply-migration-026
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(
  __dirname,
  "../../../supabase/migrations/026_course_session_workflow.sql",
);

const SQL = readFileSync(SQL_PATH, "utf8").trim();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(
      "DATABASE_URL absent — exécutez ce SQL dans Supabase SQL Editor :\n",
    );
    console.log(SQL);
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(SQL);
    console.log("Migration 026 appliquée via DATABASE_URL.");
  } finally {
    await client.end();
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
