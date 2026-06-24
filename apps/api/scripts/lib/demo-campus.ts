import type { SupabaseClient } from "@supabase/supabase-js";

/** Campus unique pour tous les comptes de démo (élève, profs, RH). */
export const DEMO_CAMPUS_NAME = "Aix";

export const DEMO_ACCOUNT_EMAILS = [
  "eleve.dupont@ensam.eu",
  "prof.martin@ensam.eu",
  "prof.cao@ensam.eu",
  "prof.maths@ensam.eu",
  "prof.dev@ensam.eu",
  "prof.meca@ensam.eu",
  "prof.design@ensam.eu",
  "prof.express@ensam.eu",
  "prof.complet@ensam.eu",
  "prof.suspended@ensam.eu",
  "prof.enattente@ensam.eu",
  "prof.onboarding@ensam.eu",
  "jules.henri@ensam.eu",
] as const;

export async function getDemoCampusId(
  admin: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await admin
    .from("campus")
    .select("id")
    .eq("name", DEMO_CAMPUS_NAME)
    .maybeSingle();

  if (error || !data) {
    console.error(`Campus ${DEMO_CAMPUS_NAME} introuvable:`, error?.message);
    return null;
  }

  return data.id as string;
}
