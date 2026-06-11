/**
 * Critères d'apparition dans « Trouver mon tuteur » (marketplace élèves).
 * Un prof en attente (pending_siret) n'apparaît qu'après validation RH → active.
 */
export function isTeacherVisibleInMarketplace(profile: {
  role: string;
  account_status: string;
  profile_setup_complete?: boolean | null;
}): boolean {
  return (
    profile.role === "teacher" &&
    profile.account_status === "active" &&
    Boolean(profile.profile_setup_complete)
  );
}

export const MARKETPLACE_TUTOR_SELECT =
  "id, first_name, last_name, role, bio, cv, cv_pdf_path, hourly_rate, subjects, account_status, campus:campus_id(name)";
