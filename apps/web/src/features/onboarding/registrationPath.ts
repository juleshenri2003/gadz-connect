import type { RegistrationPath } from "@gadz-connect/types";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { hasValidSiret } from "@/features/onboarding/fiscalLabels";

export const REGISTRATION_PATH_LABELS: Record<RegistrationPath, string> = {
  existing_siret: "Parcours express — SIRET existant",
  new_micro: "Parcours complet — nouvelle micro-entreprise",
};

export function inferRegistrationPath(
  profile: Pick<
    MyProfile,
    "registration_path" | "account_status" | "siret"
  >,
): RegistrationPath {
  if (profile.registration_path === "existing_siret") {
    return "existing_siret";
  }
  if (profile.registration_path === "new_micro") {
    return "new_micro";
  }
  if (profile.account_status === "active" && hasValidSiret(profile.siret)) {
    return "existing_siret";
  }
  return "new_micro";
}

export function registrationStatusToPath(
  status: "already_registered" | "awaiting_registration",
): RegistrationPath {
  return status === "already_registered" ? "existing_siret" : "new_micro";
}

export function registrationPathToStatus(
  path: RegistrationPath,
): "already_registered" | "awaiting_registration" {
  return path === "existing_siret" ? "already_registered" : "awaiting_registration";
}
