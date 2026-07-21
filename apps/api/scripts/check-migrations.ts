/**
 * Vérifie que les migrations Supabase 008 et 015–028 sont appliquées sur le projet configuré.
 * Applique automatiquement les migrations manquantes si DATABASE_URL est défini.
 *
 * Usage:
 *   pnpm --filter @gadz-connect/api check-migrations
 *   pnpm --filter @gadz-connect/api check-migrations -- --apply
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const APPLY = process.argv.includes("--apply");

type Probe = { id: string; label: string; run: () => Promise<boolean> };

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant dans apps/api/.env`);
  return value;
}

async function tableExists(
  sb: ReturnType<typeof createClient>,
  name: string,
): Promise<boolean> {
  const { error } = await sb.from(name).select("*").limit(0);
  if (!error) return true;
  const msg = error.message ?? "";
  return !msg.includes("does not exist") && error.code !== "42P01";
}

async function columnExists(
  sb: ReturnType<typeof createClient>,
  table: string,
  column: string,
): Promise<boolean> {
  const { error } = await sb.from(table).select(column).limit(1);
  if (!error) return true;
  const msg = error.message ?? "";
  if (msg.includes("does not exist") || msg.includes("Could not find the")) {
    return false;
  }
  return true;
}

function buildProbes(sb: ReturnType<typeof createClient>): Probe[] {
  return [
    {
      id: "008",
      label: "Workflow remplacement (replacement_proposals)",
      run: async () =>
        (await tableExists(sb, "replacement_proposals")) &&
        (await columnExists(sb, "campus_notifications", "original_provider_id")),
    },
    {
      id: "015",
      label: "Facturation SAP (payment_invoices)",
      run: async () =>
        (await tableExists(sb, "payment_invoices")) &&
        (await columnExists(sb, "profiles", "is_autoentrepreneur_verified")),
    },
    {
      id: "016",
      label: "Ventilation tripartite transactions",
      run: async () =>
        columnExists(sb, "transactions", "total_paid_parent"),
    },
    {
      id: "017",
      label: "Facturation mensuelle",
      run: async () =>
        (await tableExists(sb, "monthly_invoices")) &&
        (await columnExists(sb, "transactions", "invoice_status")),
    },
    {
      id: "018",
      label: "Contrainte monthly_invoice_lines",
      run: async () => tableExists(sb, "monthly_invoice_lines"),
    },
    {
      id: "019",
      label: "Photo de profil",
      run: async () => {
        if (!(await columnExists(sb, "profiles", "avatar_path"))) return false;
        const { data } = await sb.storage.listBuckets();
        return data?.some((b) => b.id === "profile-photos") ?? false;
      },
    },
    {
      id: "020",
      label: "Liens publics profil",
      run: async () => columnExists(sb, "profiles", "profile_links"),
    },
    {
      id: "021",
      label: "E-mail facture professeur",
      run: async () =>
        columnExists(sb, "payment_invoices", "provider_email_sent_at"),
    },
    {
      id: "022",
      label: "Payeur / bénéficiaire cours",
      run: async () => columnExists(sb, "courses", "payer_name"),
    },
    {
      id: "023",
      label: "Date début ACRE",
      run: async () => columnExists(sb, "profiles", "acre_start_date"),
    },
    {
      id: "024",
      label: "Avis élèves (course_ratings)",
      run: async () => tableExists(sb, "course_ratings"),
    },
    {
      id: "025",
      label: "Suivi pédagogique (fiches + échanges)",
      run: async () =>
        (await tableExists(sb, "course_clarifications")) &&
        (await tableExists(sb, "course_exchange_messages")) &&
        (await columnExists(sb, "course_summaries", "pdf_path")),
    },
    {
      id: "026",
      label: "Confirmations 24 h + remplacement",
      run: async () =>
        (await columnExists(sb, "courses", "confirmation_reminder_sent_at")) &&
        (await columnExists(sb, "courses", "replacement_expires_at")),
    },
    {
      id: "028",
      label: "Avance immédiate URSSAF (urssaf_clients)",
      run: async () =>
        (await tableExists(sb, "urssaf_clients")) &&
        (await columnExists(sb, "transactions", "payment_channel")) &&
        (await columnExists(sb, "courses", "is_home_visit")),
    },
    {
      id: "030",
      label: "Confirmation post-séance avant paiement",
      run: async () =>
        (await columnExists(sb, "courses", "student_session_confirmed_at")) &&
        (await columnExists(sb, "courses", "session_dispute_status")),
    },
  ];
}

async function main() {
  const sb = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const probes = buildProbes(sb);
  const missing: Probe[] = [];

  console.log("\n=== Vérification migrations Supabase (008, 015–028, 030) ===\n");

  for (const probe of probes) {
    const ok = await probe.run();
    console.log(`${ok ? "✓" : "✗"}  ${probe.id} — ${probe.label}`);
    if (!ok) missing.push(probe);
  }

  if (missing.length === 0) {
    console.log("\nToutes les migrations 008, 015–028 et 030 sont appliquées.\n");
    return;
  }

  console.log(`\n${missing.length} migration(s) manquante(s): ${missing.map((m) => m.id).join(", ")}\n`);

  if (!APPLY) {
    console.log("Pour appliquer automatiquement (nécessite DATABASE_URL dans apps/api/.env):");
    for (const m of missing) {
      console.log(`  pnpm --filter @gadz-connect/api apply-migration-${m.id}`);
    }
    console.log("\nOu relancez avec --apply\n");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "DATABASE_URL absent — ajoutez la connection string Postgres (Supabase → Settings → Database) dans apps/api/.env, puis relancez avec --apply.",
    );
    process.exit(1);
  }

  for (const m of missing) {
    console.log(`Application migration ${m.id}…`);
    execSync(`tsx scripts/apply-migration-${m.id}.ts`, {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
    });
  }

  console.log("\nMigrations appliquées. Relancez check-migrations pour confirmer.\n");
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
