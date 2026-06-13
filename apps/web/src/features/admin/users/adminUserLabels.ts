import type { RegistrationPath } from "@gadz-connect/types";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";

export { ROLE_LABELS, STATUS_LABELS };

export const REGISTRATION_PATH_SHORT: Record<RegistrationPath, string> = {
  existing_siret: "SIRET existant",
  new_micro: "Nouvelle micro",
};

export const STRIPE_STATUS_LABELS = {
  none: "Non",
  pending: "En cours",
  active: "Actif",
} as const;

export function getStripeStatus(profile: {
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
}): keyof typeof STRIPE_STATUS_LABELS {
  if (!profile.stripe_connect_account_id) return "none";
  if (!profile.stripe_connect_onboarding_complete) return "pending";
  return "active";
}

export function formatUserDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatUserDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUserName(
  firstName: string,
  lastName: string,
): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || "—";
}

export function maskStripeAccountId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 8) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
