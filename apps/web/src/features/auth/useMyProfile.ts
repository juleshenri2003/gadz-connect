import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountStatus, RegistrationPath, UserRole } from "@gadz-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import type { MarketplaceStatus } from "@/features/marketplace/useTutors";
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
  registration_path: RegistrationPath | null;
  siret_verification_failed: boolean;
  status_acre: boolean;
  micro_enterprise_activity: string | null;
  urssaf_periodicity: string | null;
  versement_liberatoire: boolean;
  profile_setup_complete: boolean;
  inpi_declaration_sent_at: string | null;
  stripe_connect_onboarding_complete: boolean;
  bio: string | null;
  cv: string | null;
  cv_pdf_path: string | null;
  cv_complete: boolean;
  hourly_rate: number | null;
  subjects: string[];
  created_at?: string;
  updated_at: string;
  campus: { name: string } | null;
  marketplace?: MarketplaceStatus;
  future_slot_count?: number;
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

export function useUpdateProfileIdentity() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      firstName?: string;
      lastName?: string;
      campusId?: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: MyProfile }>("/api/profile/identity", {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      void queryClient.invalidateQueries({ queryKey: ["provider-progress"] });
    },
  });
}

export function useIsAdmin() {
  const { data: profile, ...rest } = useMyProfile();
  const isAdmin = Boolean(
    profile?.role && ADMIN_ROLES.includes(profile.role as UserRole),
  );
  return { isAdmin, profile, ...rest };
}
