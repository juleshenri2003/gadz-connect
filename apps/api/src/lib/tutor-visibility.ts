/**
 * Critères d'apparition dans « Trouver mon tuteur » (marketplace élèves).
 */
export interface MarketplaceChecks {
  rate: boolean;
  futureSlots: boolean;
  stripe: boolean;
  profileSetup: boolean;
}

export interface MarketplaceStatus {
  visible: boolean;
  checks: MarketplaceChecks;
}

function hasValidSiret(siret: string | null | undefined): boolean {
  return /^\d{14}$/.test((siret ?? "").replace(/\s/g, ""));
}

export function isTeacherVisibleInMarketplace(profile: {
  role: string;
  account_status: string;
  profile_setup_complete?: boolean | null;
  stripe_connect_onboarding_complete?: boolean | null;
  hourly_rate?: number | null;
  siret?: string | null;
  is_autoentrepreneur_verified?: boolean | null;
}): boolean {
  return (
    profile.role === "teacher" &&
    profile.account_status === "active" &&
    Boolean(profile.profile_setup_complete) &&
    Boolean(profile.stripe_connect_onboarding_complete) &&
    hasValidSiret(profile.siret) &&
    Boolean(profile.is_autoentrepreneur_verified) &&
    profile.hourly_rate != null &&
    profile.hourly_rate > 0
  );
}

export function computeMarketplaceStatus(
  profile: {
    role: string;
    account_status: string;
    profile_setup_complete?: boolean | null;
    stripe_connect_onboarding_complete?: boolean | null;
    hourly_rate?: number | null;
    siret?: string | null;
    is_autoentrepreneur_verified?: boolean | null;
  },
  futureSlotCount: number,
): MarketplaceStatus {
  const checks: MarketplaceChecks = {
    rate: profile.hourly_rate != null && profile.hourly_rate > 0,
    futureSlots: futureSlotCount > 0,
    stripe: Boolean(profile.stripe_connect_onboarding_complete),
    profileSetup: Boolean(profile.profile_setup_complete),
  };

  const visible =
    profile.role === "teacher" &&
    profile.account_status === "active" &&
    hasValidSiret(profile.siret) &&
    Boolean(profile.is_autoentrepreneur_verified) &&
    checks.rate &&
    checks.futureSlots &&
    checks.stripe &&
    checks.profileSetup;

  return { visible, checks };
}

export const MARKETPLACE_TUTOR_SELECT =
  "id, first_name, last_name, role, bio, cv, cv_pdf_path, avatar_path, hourly_rate, subjects, profile_links, account_status, stripe_connect_onboarding_complete, profile_setup_complete, siret, is_autoentrepreneur_verified, campus:campus_id(name)";

export function isCvComplete(profile: {
  cv?: string | null;
  cv_pdf_path?: string | null;
}): boolean {
  if (profile.cv_pdf_path) return true;
  return (profile.cv?.trim().length ?? 0) >= 50;
}
