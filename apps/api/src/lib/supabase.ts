import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "[api] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour l'auth et les webhooks.",
  );
}

/** Client admin (service_role) — toutes les lectures/écritures métier */
export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceRoleKey ?? "placeholder-service-role",
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/**
 * Client auth (anon) — uniquement côté serveur pour Magic Link et échange de session.
 * Jamais exposé au frontend.
 */
export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
