/**
 * Applique les migrations 008 et 009 sur Supabase.
 * Usage: pnpm --filter @gadz-connect/api apply-migration-008-009
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = ["008_replacement_workflow.sql", "009_student_repository.sql"];

async function applyViaDatabaseUrl(sql: string): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    return true;
  } finally {
    await client.end();
  }
}

async function verify008Enums(client: import("pg").Client): Promise<boolean> {
  const res = await client.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'course_status' AND e.enumlabel = 'awaiting_replacement'
    ) AS exists
    `,
  );
  return Boolean(res.rows[0]?.exists);
}

async function verify008Table(): Promise<boolean> {
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.from("replacement_proposals").select("id").limit(1);
  return !error;
}

async function verify009(): Promise<boolean> {
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.from("student_subject_folders").select("id").limit(1);
  return !error || error.code !== "42P01";
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  let enumsOk = false;

  if (databaseUrl) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      enumsOk = await verify008Enums(client);
    } finally {
      await client.end();
    }
  }

  if (enumsOk && (await verify008Table()) && (await verify009())) {
    console.log("Migrations 008 et 009 déjà appliquées.");
    return;
  }

  if (!enumsOk) {
    console.log("⚠ Valeurs enum manquantes — lancez : pnpm fix-replacement-enums");
  }

  for (const file of MIGRATIONS) {
    const sql = readFileSync(
      join(__dirname, "../../../supabase/migrations", file),
      "utf8",
    ).trim();

    if (await applyViaDatabaseUrl(sql)) {
      console.log(`✓ ${file} appliquée via DATABASE_URL`);
      continue;
    }

    console.log("");
    console.log(`→ Appliquez ${file} dans Supabase SQL Editor :`);
    console.log("");
    console.log(sql);
    console.log("");
  }

  if (!(await verify008Table()) || !(await verify009())) {
    console.log(
      "Ajoutez DATABASE_URL dans apps/api/.env ou exécutez le SQL manuellement.",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
