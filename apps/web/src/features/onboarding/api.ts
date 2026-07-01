import type { AccountStatus } from "@gadz-connect/types";
import type { OnboardingFormValues } from "./schemas";
import { getAccessToken } from "@/lib/session";
import { apiFetch } from "@/lib/api";

export async function saveOnboardingToProfile(
  values: OnboardingFormValues,
): Promise<{ error: string | null; accountStatus?: AccountStatus }> {
  const token = getAccessToken();
  if (!token) {
    return { error: "Vous devez être connecté pour enregistrer l'onboarding." };
  }

  try {
    const res = await apiFetch<{
      data: { account_status: AccountStatus; siret: string | null };
    }>("/api/profile/onboarding", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        activity: values.activity,
        urssafPeriodicity: values.urssafPeriodicity,
        versementLiberatoire: values.versementLiberatoire,
        statusAcre: values.statusAcre ?? false,
        acreStartDate:
          values.statusAcre && values.acreStartDate?.trim()
            ? values.acreStartDate
            : undefined,
        registrationStatus: values.registrationStatus,
        siret:
          values.registrationStatus === "already_registered"
            ? values.siret?.replace(/\s/g, "")
            : undefined,
      }),
    });
    return { error: null, accountStatus: res.data.account_status };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function saveMicroEnterpriseAddress(
  microEnterpriseAddress: string,
  token: string,
): Promise<{ micro_enterprise_address: string }> {
  const res = await apiFetch<{
    data: { micro_enterprise_address: string };
  }>("/api/profile/billing", {
    method: "PATCH",
    token,
    body: JSON.stringify({ microEnterpriseAddress }),
  });
  return res.data;
}
