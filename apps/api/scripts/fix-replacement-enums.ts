/**
 * Ajoute les valeurs d'enum manquantes pour le workflow remplacement.
 * Usage: pnpm --filter @gadz-connect/api fix-replacement-enums
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const ENUM_FIXES: { type: string; values: string[] }[] = [
  {
    type: "course_status",
    values: ["awaiting_replacement"],
  },
  {
    type: "notification_kind",
    values: [
      "replacement_proposed",
      "replacement_accepted",
      "replacement_declined",
    ],
  },
];

async function enumHasValue(
  client: import("pg").Client,
  typeName: string,
  value: string,
): Promise<boolean> {
  const res = await client.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = $1
        AND e.enumlabel = $2
    ) AS exists
    `,
    [typeName, value],
  );
  return Boolean(res.rows[0]?.exists);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL manquant dans apps/api/.env");
    console.log("");
    console.log("Exécutez dans Supabase → SQL Editor :");
    for (const fix of ENUM_FIXES) {
      for (const value of fix.values) {
        console.log(
          `ALTER TYPE public.${fix.type} ADD VALUE IF NOT EXISTS '${value}';`,
        );
      }
    }
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    for (const fix of ENUM_FIXES) {
      for (const value of fix.values) {
        const exists = await enumHasValue(client, fix.type, value);
        if (exists) {
          console.log(`✓ ${fix.type}.${value} déjà présent`);
          continue;
        }
        await client.query(
          `ALTER TYPE public.${fix.type} ADD VALUE '${value}'`,
        );
        console.log(`✓ ${fix.type}.${value} ajouté`);
      }
    }
  } finally {
    await client.end();
  }

  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: sampleCourse } = await admin
    .from("courses")
    .select("id, status")
    .limit(1)
    .maybeSingle();

  if (!sampleCourse) {
    console.warn("Aucun cours en base — vérification enum ignorée.");
    return;
  }

  const previousStatus = sampleCourse.status;
  const { error } = await admin
    .from("courses")
    .update({ status: "awaiting_replacement" })
    .eq("id", sampleCourse.id);

  if (error?.message.includes("awaiting_replacement")) {
    console.error(
      "Échec : l'enum course_status n'accepte toujours pas awaiting_replacement",
    );
    process.exit(1);
  }

  await admin
    .from("courses")
    .update({ status: previousStatus })
    .eq("id", sampleCourse.id);

  console.log("");
  console.log("Enums OK — vous pouvez redéclarer une indisponibilité prof.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
