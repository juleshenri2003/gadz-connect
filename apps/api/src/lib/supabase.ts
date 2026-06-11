import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import ws from "ws";

type ServerSupabaseOptions = SupabaseClientOptions<"public">;
type RealtimeTransport = NonNullable<
  NonNullable<ServerSupabaseOptions["realtime"]>["transport"]
>;

const serverSupabaseOptions: ServerSupabaseOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as unknown as RealtimeTransport },
};

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
  serverSupabaseOptions,
);

/**
 * Client auth (anon) — uniquement côté serveur pour Magic Link et échange de session.
 * Jamais exposé au frontend.
 */
export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, serverSupabaseOptions)
  : null;
