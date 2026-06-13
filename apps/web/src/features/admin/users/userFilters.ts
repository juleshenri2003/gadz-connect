import type { AccountStatus, UserRole } from "@gadz-connect/types";
import type { AdminProfileRow } from "@/features/admin/types";

export type UserPresetFilter =
  | "verification_failed"
  | "duplicates"
  | "suspended"
  | "pending_siret"
  | "stripe_incomplete";

export interface UserFiltersState {
  search: string;
  role: UserRole | "admin" | "all";
  accountStatus: AccountStatus | "all";
  campusId: string | "all";
  preset: UserPresetFilter | null;
}

export const PRESET_FILTER_LABELS: Record<UserPresetFilter, string> = {
  verification_failed: "Vérification SIRET en échec",
  duplicates: "SIRET en doublon",
  suspended: "Comptes suspendus",
  pending_siret: "En attente SIRET",
  stripe_incomplete: "Stripe incomplet",
};

export const DEFAULT_USER_FILTERS: UserFiltersState = {
  search: "",
  role: "all",
  accountStatus: "all",
  campusId: "all",
  preset: null,
};

export function parsePresetFilter(
  value: string | null,
): UserPresetFilter | null {
  if (!value) return null;
  if (value in PRESET_FILTER_LABELS) {
    return value as UserPresetFilter;
  }
  return null;
}

export function computeDuplicateSirets(
  profiles: Array<{ siret: string | null }>,
): Set<string> {
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    if (!profile.siret) continue;
    counts.set(profile.siret, (counts.get(profile.siret) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [siret, count] of counts) {
    if (count > 1) duplicates.add(siret);
  }
  return duplicates;
}

export function computeUserKpis(profiles: AdminProfileRow[]) {
  const duplicateSirets = computeDuplicateSirets(profiles);
  const duplicateCount = profiles.filter(
    (p) => p.siret && duplicateSirets.has(p.siret),
  ).length;

  return {
    total: profiles.length,
    pendingSiret: profiles.filter((p) => p.account_status === "pending_siret")
      .length,
    verificationFailed: profiles.filter((p) => p.siret_verification_failed)
      .length,
    suspended: profiles.filter((p) => p.account_status === "suspended").length,
    duplicateCount,
  };
}

export function filtersToQueryParams(filters: UserFiltersState) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.role !== "all") params.set("role", filters.role);
  if (filters.accountStatus !== "all") {
    params.set("account_status", filters.accountStatus);
  }
  if (filters.campusId !== "all") params.set("campus_id", filters.campusId);
  if (filters.preset) params.set("filter", filters.preset);
  return params;
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): UserFiltersState {
  const role = params.get("role");
  const accountStatus = params.get("account_status");

  return {
    search: params.get("search") ?? "",
    role:
      role === "admin" ||
      role === "student_provider" ||
      role === "teacher" ||
      role === "admin_campus" ||
      role === "admin_general"
        ? role
        : "all",
    accountStatus:
      accountStatus === "pending_siret" ||
      accountStatus === "active" ||
      accountStatus === "suspended"
        ? accountStatus
        : "all",
    campusId: params.get("campus_id") ?? "all",
    preset: parsePresetFilter(params.get("filter")),
  };
}

export function getActiveFilterLabel(filters: UserFiltersState): string | null {
  const parts: string[] = [];
  if (filters.preset) {
    parts.push(PRESET_FILTER_LABELS[filters.preset]);
  }
  if (filters.role !== "all") {
    parts.push(`Rôle : ${filters.role}`);
  }
  if (filters.accountStatus !== "all") {
    parts.push(`Statut : ${filters.accountStatus}`);
  }
  if (filters.campusId !== "all") {
    parts.push(`Campus filtré`);
  }
  if (filters.search.trim()) {
    parts.push(`Recherche « ${filters.search.trim()} »`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getEmptyStateMessage(filters: UserFiltersState): string {
  if (filters.preset === "suspended") {
    return "Aucun compte suspendu pour le moment.";
  }
  if (filters.preset === "verification_failed") {
    return "Aucune vérification SIRET en échec.";
  }
  if (filters.preset === "duplicates") {
    return "Aucun SIRET en doublon détecté.";
  }
  if (filters.preset === "pending_siret") {
    return "Aucun profil en attente de SIRET.";
  }
  if (filters.search.trim()) {
    return `Aucun résultat pour « ${filters.search.trim()} ».`;
  }
  return "Aucun utilisateur. Les inscriptions apparaîtront ici automatiquement.";
}
