import type { AccountStatus, UserRole } from "@gadz-connect/types";
import { supabaseAdmin } from "./supabase.js";
import { fetchProfileByUserId } from "./profile-query.js";

export type AdminProfileFilter =
  | "verification_failed"
  | "duplicates"
  | "suspended"
  | "pending_siret"
  | "stripe_incomplete";

export interface AdminProfilesListParams {
  /** Périmètre admin campus (injecté par la route). */
  campusScopeId?: string;
  search?: string;
  role?: UserRole | "admin";
  account_status?: AccountStatus;
  campus_id?: string;
  filter?: AdminProfileFilter;
  page?: number;
  limit?: number;
}

export interface AdminProfileListRow {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  campus_id: string;
  siret: string | null;
  account_status: AccountStatus;
  micro_enterprise_activity: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  registration_path: string | null;
  siret_verification_failed: boolean;
  created_at: string;
  campus: { name: string } | null;
  email: string | null;
  last_sign_in_at: string | null;
  siret_is_duplicate: boolean;
}

export interface AdminProfilesListResult {
  rows: AdminProfileListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProfileDetail extends AdminProfileListRow {
  status_acre: boolean;
  versement_liberatoire: boolean;
  urssaf_periodicity: string | null;
  profile_setup_complete: boolean;
  bio: string | null;
  hourly_rate: number | null;
  subjects: string[] | null;
  inpi_declaration_sent_at: string | null;
  updated_at: string;
  coursesAsProvider: number;
  coursesAsClient: number;
}

const PROFILE_LIST_SELECT = `
  id,
  first_name,
  last_name,
  role,
  campus_id,
  siret,
  account_status,
  micro_enterprise_activity,
  stripe_connect_account_id,
  stripe_connect_onboarding_complete,
  registration_path,
  siret_verification_failed,
  created_at,
  campus:campus_id ( name )
`;

type RawProfileRow = Omit<
  AdminProfileListRow,
  "email" | "last_sign_in_at" | "siret_is_duplicate"
> & {
  campus: { name: string } | { name: string }[] | null;
};

function pickCampus(
  campus: RawProfileRow["campus"],
): { name: string } | null {
  if (!campus) return null;
  return Array.isArray(campus) ? (campus[0] ?? null) : campus;
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

export async function buildAuthUserMap(
  userIds: string[],
): Promise<Map<string, { email: string | null; last_sign_in_at: string | null }>> {
  const map = new Map<
    string,
    { email: string | null; last_sign_in_at: string | null }
  >();
  if (userIds.length === 0) return map;

  const remaining = new Set(userIds);
  let page = 1;
  const perPage = 1000;

  while (remaining.size > 0) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("[admin-profiles] listUsers:", error.message);
      break;
    }

    for (const user of data.users) {
      if (remaining.has(user.id)) {
        map.set(user.id, {
          email: user.email ?? null,
          last_sign_in_at: user.last_sign_in_at ?? null,
        });
        remaining.delete(user.id);
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  return map;
}

function matchesSearch(row: AdminProfileListRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const fullName = `${row.first_name} ${row.last_name}`.trim().toLowerCase();
  const siretQuery = query.replace(/\s/g, "");

  return (
    fullName.includes(query) ||
    row.first_name.toLowerCase().includes(query) ||
    row.last_name.toLowerCase().includes(query) ||
    (row.email?.toLowerCase().includes(query) ?? false) ||
    (row.siret?.includes(siretQuery) ?? false) ||
    row.id.toLowerCase().includes(query)
  );
}

function matchesPresetFilter(
  row: AdminProfileListRow,
  filter: AdminProfileFilter | undefined,
): boolean {
  if (!filter) return true;

  switch (filter) {
    case "verification_failed":
      return row.siret_verification_failed === true;
    case "duplicates":
      return row.siret_is_duplicate;
    case "suspended":
      return row.account_status === "suspended";
    case "pending_siret":
      return row.account_status === "pending_siret";
    case "stripe_incomplete":
      return (
        row.role === "teacher" &&
        (!row.stripe_connect_account_id ||
          !row.stripe_connect_onboarding_complete)
      );
    default:
      return true;
  }
}

function matchesRoleFilter(
  row: AdminProfileListRow,
  role: AdminProfilesListParams["role"],
): boolean {
  if (!role) return true;
  if (role === "admin") {
    return row.role === "admin_campus" || row.role === "admin_general";
  }
  return row.role === role;
}

function sortProfiles(rows: AdminProfileListRow[]): AdminProfileListRow[] {
  const statusOrder: Record<AccountStatus, number> = {
    pending_siret: 0,
    suspended: 1,
    active: 2,
  };

  return rows.slice().sort((a, b) => {
    const statusDiff =
      statusOrder[a.account_status] - statusOrder[b.account_status];
    if (statusDiff !== 0) return statusDiff;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export async function listAdminProfiles(
  params: AdminProfilesListParams,
): Promise<AdminProfilesListResult> {
  let query = supabaseAdmin
    .from("profiles")
    .select(PROFILE_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (params.campusScopeId) {
    query = query.eq("campus_id", params.campusScopeId);
  }

  if (params.campus_id) {
    query = query.eq("campus_id", params.campus_id);
  }

  if (params.account_status) {
    query = query.eq("account_status", params.account_status);
  }

  if (params.role && params.role !== "admin") {
    query = query.eq("role", params.role);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rawRows = (data ?? []) as RawProfileRow[];
  const duplicateSirets = computeDuplicateSirets(rawRows);

  let roleFiltered = rawRows;
  if (params.role === "admin") {
    roleFiltered = rawRows.filter(
      (row) => row.role === "admin_campus" || row.role === "admin_general",
    );
  }

  const authMap = await buildAuthUserMap(roleFiltered.map((row) => row.id));

  let enriched: AdminProfileListRow[] = roleFiltered.map((row) => ({
    ...row,
    campus: pickCampus(row.campus),
    siret_verification_failed: row.siret_verification_failed ?? false,
    email: authMap.get(row.id)?.email ?? null,
    last_sign_in_at: authMap.get(row.id)?.last_sign_in_at ?? null,
    siret_is_duplicate: row.siret ? duplicateSirets.has(row.siret) : false,
  }));

  if (params.filter) {
    enriched = enriched.filter((row) =>
      matchesPresetFilter(row, params.filter),
    );
  }

  if (params.search) {
    enriched = enriched.filter((row) => matchesSearch(row, params.search!));
  }

  enriched = sortProfiles(enriched);

  const total = enriched.length;
  const pageSize = params.limit ?? (params.page ? 25 : total || 25);
  const page = params.page ?? 1;

  if (params.page || params.limit) {
    const start = (page - 1) * pageSize;
    enriched = enriched.slice(start, start + pageSize);
  }

  return {
    rows: enriched,
    total,
    page,
    pageSize,
  };
}

export async function fetchAdminProfileDetail(
  profileId: string,
  campusScopeId?: string,
): Promise<AdminProfileDetail | null> {
  const { data: profile, error } = await fetchProfileByUserId(profileId);

  if (error || !profile) return null;

  if (campusScopeId && profile.campus_id !== campusScopeId) {
    return null;
  }

  const authMap = await buildAuthUserMap([profileId]);

  const [{ count: coursesAsProvider }, { count: coursesAsClient }] =
    await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", profileId),
      supabaseAdmin
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("client_id", profileId),
    ]);

  let siretIsDuplicate = false;
  if (profile.siret) {
    const { data: siretPeers } = await supabaseAdmin
      .from("profiles")
      .select("id, siret")
      .eq("siret", profile.siret as string);
    siretIsDuplicate = (siretPeers?.length ?? 0) > 1;
  }

  const campus = pickCampus(
    profile.campus as RawProfileRow["campus"],
  );

  return {
    id: profile.id as string,
    first_name: (profile.first_name as string) ?? "",
    last_name: (profile.last_name as string) ?? "",
    role: profile.role as UserRole,
    campus_id: profile.campus_id as string,
    siret: (profile.siret as string | null) ?? null,
    account_status: profile.account_status as AccountStatus,
    micro_enterprise_activity:
      (profile.micro_enterprise_activity as string | null) ?? null,
    stripe_connect_account_id:
      (profile.stripe_connect_account_id as string | null) ?? null,
    stripe_connect_onboarding_complete: Boolean(
      profile.stripe_connect_onboarding_complete,
    ),
    registration_path: (profile.registration_path as string | null) ?? null,
    siret_verification_failed: Boolean(profile.siret_verification_failed),
    created_at: profile.created_at as string,
    campus,
    email: authMap.get(profileId)?.email ?? null,
    last_sign_in_at: authMap.get(profileId)?.last_sign_in_at ?? null,
    siret_is_duplicate: siretIsDuplicate,
    status_acre: Boolean(profile.status_acre),
    versement_liberatoire: Boolean(profile.versement_liberatoire),
    urssaf_periodicity: (profile.urssaf_periodicity as string | null) ?? null,
    profile_setup_complete: Boolean(profile.profile_setup_complete),
    bio: (profile.bio as string | null) ?? null,
    hourly_rate:
      typeof profile.hourly_rate === "number"
        ? profile.hourly_rate
        : profile.hourly_rate
          ? Number(profile.hourly_rate)
          : null,
    subjects: (profile.subjects as string[] | null) ?? null,
    inpi_declaration_sent_at:
      (profile.inpi_declaration_sent_at as string | null) ?? null,
    updated_at: profile.updated_at as string,
    coursesAsProvider: coursesAsProvider ?? 0,
    coursesAsClient: coursesAsClient ?? 0,
  };
}
