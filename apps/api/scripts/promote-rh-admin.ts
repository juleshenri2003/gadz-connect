/**
 * Promouvoir jules.henri@ensam.eu en admin_general (accès /admin).
 * Usage: pnpm --filter @gadz-connect/api promote-rh-admin
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const RH_EMAIL = "jules.henri@ensam.eu";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("listUsers:", listError.message);
    process.exit(1);
  }

  const user = users.users.find(
    (u) => u.email?.toLowerCase() === RH_EMAIL.toLowerCase(),
  );
  if (!user) {
    console.error(
      `Utilisateur ${RH_EMAIL} introuvable — connectez-vous une fois puis relancez.`,
    );
    process.exit(1);
  }

  const { data: campus } = await admin
    .from("campus")
    .select("id")
    .eq("name", "Aix")
    .maybeSingle();

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      role: "admin_general",
      campus_id: campus?.id,
      first_name: "Jules",
      last_name: "Henri",
      account_status: "active",
      profile_setup_complete: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("profiles upsert:", error.message);
    process.exit(1);
  }

  console.log(`✓ ${RH_EMAIL} promu admin_general (${user.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
