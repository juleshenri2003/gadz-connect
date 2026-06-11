/**
 * Applique la migration 005 (inpi_declaration_sent_at) sur Supabase.
 * Usage: pnpm --filter @gadz-connect/api apply-migration-005
 *
 * Option A — DATABASE_URL dans apps/api/.env (connexion Postgres directe)
 * Option B — copier le SQL affiché dans Supabase → SQL Editor
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(
  __dirname,
  "../../../supabase/migrations/005_onboarding_progress.sql",
);

const SQL = readFileSync(SQL_PATH, "utf8").trim();

async function applyViaDatabaseUrl(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(SQL);
    console.log("Migration 005 appliquée via DATABASE_URL.");
    return true;
  } finally {
    await client.end();
  }
}

async function verifyColumn(): Promise<boolean> {
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin
    .from("profiles")
    .select("inpi_declaration_sent_at")
    .limit(1);
  return !error || error.code !== "42703";
}

async function main() {
  if (await verifyColumn()) {
    console.log("La colonne inpi_declaration_sent_at existe déjà.");
    return;
  }

  if (await applyViaDatabaseUrl()) {
    if (await verifyColumn()) return;
    console.error("Migration exécutée mais colonne toujours absente.");
    process.exit(1);
  }

  console.log("");
  console.log("La migration 005 n'est pas encore appliquée sur votre projet Supabase.");
  console.log("");
  console.log("→ Ouvrez Supabase → SQL Editor → New query, puis collez :");
  console.log("");
  console.log(SQL);
  console.log("");
  console.log(
    "Ou ajoutez DATABASE_URL (Settings → Database → Connection string) dans apps/api/.env",
  );
  console.log("et relancez : pnpm --filter @gadz-connect/api apply-migration-005");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
