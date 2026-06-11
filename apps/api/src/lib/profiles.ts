import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase.js";

export const DEFAULT_CAMPUS_NAME = "Paris";

async function defaultCampusId(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("campus")
    .select("id")
    .eq("name", DEFAULT_CAMPUS_NAME)
    .maybeSingle();

  if (error || !data) {
    console.error("[api] campus Paris introuvable:", error?.message);
    return null;
  }

  return data.id as string;
}

/**
 * Garantit une ligne profiles pour auth.uid().
 * Utile si l'utilisateur a été créé avant le trigger on_auth_user_created.
 */
export async function ensureProfileForUser(
  user: User,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[api] lecture profil:", fetchError.message, fetchError.code);
    return { ok: false, message: "Impossible de lire le profil" };
  }

  if (existing) {
    return { ok: true };
  }

  const campusId = await defaultCampusId();
  if (!campusId) {
    return { ok: false, message: "Campus par défaut introuvable" };
  }

  const meta = user.user_metadata ?? {};
  const { error: insertError } = await supabaseAdmin.from("profiles").insert({
    id: user.id,
    first_name: (meta.first_name as string | undefined) ?? "",
    last_name: (meta.last_name as string | undefined) ?? "",
    campus_id: campusId,
    profile_setup_complete: false,
  });

  if (insertError) {
    console.error("[api] création profil:", insertError.message, insertError.code);
    return { ok: false, message: "Impossible de créer le profil" };
  }

  console.info("[api] profil créé pour", user.id);
  return { ok: true };
}
