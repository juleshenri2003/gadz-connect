/**
 * Aligne tous les comptes de démo sur le même campus (Paris).
 * Usage: pnpm --filter @gadz-connect/api align-demo-campus
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  DEMO_ACCOUNT_EMAILS,
  getDemoCampusId,
} from "./lib/demo-campus.js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) {
    process.exit(1);
  }

  const { data: userList, error: listError } =
    await admin.auth.admin.listUsers({ perPage: 1000 });

  if (listError) {
    console.error("listUsers:", listError.message);
    process.exit(1);
  }

  let updated = 0;
  for (const email of DEMO_ACCOUNT_EMAILS) {
    const user = userList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!user) {
      console.log(`— ${email} : compte auth absent (lancez le seed)`);
      continue;
    }

    const { error } = await admin
      .from("profiles")
      .update({ campus_id: campusId })
      .eq("id", user.id);

    if (error) {
      console.error(`✗ ${email}:`, error.message);
      continue;
    }

    console.log(`✓ ${email} → campus Paris`);
    updated += 1;
  }

  console.log("");
  console.log(`Terminé — ${updated} profil(s) aligné(s) sur Paris.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
