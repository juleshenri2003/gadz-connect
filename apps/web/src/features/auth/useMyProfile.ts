import { useQuery } from "@tanstack/react-query";
import type { AccountStatus, UserRole } from "@gadz-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

const ADMIN_ROLES: UserRole[] = ["admin_campus", "admin_general"];

export interface MyProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  campus_id: string;
  siret: string | null;
  account_status: AccountStatus;
  micro_enterprise_activity: string | null;
  urssaf_periodicity: string | null;
  versement_liberatoire: boolean;
  profile_setup_complete: boolean;
  bio: string | null;
  hourly_rate: number | null;
  subjects: string[];
  campus: { name: string } | null;
}

export function useMyProfile() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["profile-me", user?.id],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");

      const res = await apiFetch<{ data: MyProfile }>("/api/profile/me", {
        token,
      });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useIsAdmin() {
  const { data: profile, ...rest } = useMyProfile();
  const isAdmin = Boolean(
    profile?.role && ADMIN_ROLES.includes(profile.role as UserRole),
  );
  return { isAdmin, profile, ...rest };
}
