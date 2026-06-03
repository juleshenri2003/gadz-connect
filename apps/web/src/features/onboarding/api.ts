import type { OnboardingFormValues } from "./schemas";
import { supabase } from "@/lib/supabase";

export async function saveOnboardingToProfile(
  values: OnboardingFormValues,
): Promise<{ error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour enregistrer l'onboarding." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      micro_enterprise_activity: values.activity,
      urssaf_periodicity: values.urssafPeriodicity,
      versement_liberatoire: values.versementLiberatoire,
      account_status: "pending_siret",
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
