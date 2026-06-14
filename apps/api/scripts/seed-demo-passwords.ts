/**
 * Applique les mots de passe démo sur tous les comptes persona connus.
 * Usage: pnpm --filter @gadz-connect/api seed-demo-passwords
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { listDemoAccounts } from "../src/lib/demo-accounts.js";
import { syncAllDemoPasswords } from "./lib/demo-auth.js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  console.log("── Mots de passe démo ──\n");
  await syncAllDemoPasswords(admin);
  console.log("\nRéférence :");
  for (const { email, password, label } of listDemoAccounts()) {
    console.log(`  ${email}`);
    console.log(`    ${password}  — ${label}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
