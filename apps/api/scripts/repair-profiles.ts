/**
 * Crée les lignes profiles manquantes pour les utilisateurs auth existants.
 * Usage: pnpm --filter @gadz-connect/api repair-profiles
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans apps/api/.env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: campus, error: campusError } = await admin
    .from("campus")
    .select("id")
    .eq("name", "Paris")
    .maybeSingle();

  if (campusError || !campus) {
    console.error("Campus Paris introuvable:", campusError?.message);
    process.exit(1);
  }

  const campusId = campus.id as string;
  let page = 1;
  let created = 0;
  let skipped = 0;

  for (;;) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (listError) {
      console.error("listUsers:", listError.message);
      process.exit(1);
    }

    const users = list.users;
    if (users.length === 0) break;

    for (const user of users) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        skipped += 1;
        continue;
      }

      const meta = user.user_metadata ?? {};
      const { error: insertError } = await admin.from("profiles").insert({
        id: user.id,
        first_name: (meta.first_name as string | undefined) ?? "",
        last_name: (meta.last_name as string | undefined) ?? "",
        campus_id: campusId,
      });

      if (insertError) {
        console.error(`Échec ${user.email ?? user.id}:`, insertError.message);
        continue;
      }

      console.log(`Profil créé: ${user.email ?? user.id}`);
      created += 1;
    }

    if (users.length < 100) break;
    page += 1;
  }

  console.log(`Terminé — créés: ${created}, déjà présents: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
