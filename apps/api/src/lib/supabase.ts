import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "[api] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour l'auth et les webhooks.",
  );
}

/** Client admin (bypass RLS) — webhooks Stripe, jobs serveur */
export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceRoleKey ?? "placeholder-service-role",
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export function createSupabaseUserClient(accessToken: string) {
  return createClient(
    supabaseUrl ?? "https://placeholder.supabase.co",
    supabaseAnonKey ?? "placeholder-anon",
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
