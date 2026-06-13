import { supabaseAdmin } from "./supabase.js";

export async function findSiretOwner(
  siret: string,
  excludeUserId?: string,
): Promise<{ id: string; first_name: string; last_name: string } | null> {
  const normalized = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(normalized)) return null;

  let query = supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("siret", normalized);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data } = await query.maybeSingle();
  return data as { id: string; first_name: string; last_name: string } | null;
}

export async function assertSiretUnique(
  siret: string,
  excludeUserId?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const owner = await findSiretOwner(siret, excludeUserId);
  if (owner) {
    return {
      ok: false,
      message:
        "Ce numéro SIRET est déjà associé à un autre compte. Contactez l'équipe campus si vous pensez qu'il s'agit d'une erreur.",
    };
  }
  return { ok: true };
}
