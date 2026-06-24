import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  inferRegistrationPath,
  registrationPathToStatus,
} from "@/features/onboarding/registrationPath";

/** Tous les profs Gadz'Connect exercent en soutien scolaire / cours particuliers. */
export const DEFAULT_MICRO_ENTERPRISE_ACTIVITY = "enseignement" as const;

export const ACTIVITY_OPTIONS = [
  { value: "enseignement", label: "Enseignement / cours particuliers" },
  { value: "conseil", label: "Conseil et accompagnement" },
  {
    value: "prestation_intellectuelle",
    label: "Prestation intellectuelle (BNC)",
  },
] as const;

export type MicroEnterpriseActivity = (typeof ACTIVITY_OPTIONS)[number]["value"];

export const URSSAF_PERIODICITY_LABELS: Record<string, string> = {
  quarterly: "Trimestrielle",
  monthly: "Mensuelle",
};

export const REGISTRATION_STATUS_LABELS = {
  awaiting_registration: "J'attends mon SIRET INSEE",
  already_registered: "Je possède déjà un SIRET",
} as const;

export function hasValidSiret(siret: string | null | undefined): boolean {
  return /^\d{14}$/.test((siret ?? "").replace(/\s/g, ""));
}

export function isQuestionnaireEditable(profile: MyProfile): boolean {
  return (
    profile.account_status === "pending_siret" && !hasValidSiret(profile.siret)
  );
}

export function inferRegistrationStatus(
  profile: MyProfile,
): keyof typeof REGISTRATION_STATUS_LABELS {
  return registrationPathToStatus(inferRegistrationPath(profile));
}

export function getActivityLabel(activity: string | null | undefined): string {
  if (!activity) return "—";
  const match = ACTIVITY_OPTIONS.find((opt) => opt.value === activity);
  return match?.label ?? activity;
}

export function getUrssafPeriodicityLabel(
  periodicity: string | null | undefined,
): string {
  if (!periodicity) return "—";
  return URSSAF_PERIODICITY_LABELS[periodicity] ?? periodicity;
}
