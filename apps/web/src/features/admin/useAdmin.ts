import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountStatus } from "@gadz-connect/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";
import type { AdminDashboardData, AdminMe, AdminProfileRow } from "./types";

function authHeaders(token: string | undefined) {
  if (!token) throw new Error("Non authentifié");
  return { token };
}

export function useAdminMe() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => {
      const res = await apiFetch<{ data: AdminMe }>(
        "/api/admin/me",
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
    retry: false,
  });
}

export function useAdminDashboard() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await apiFetch<{ data: AdminDashboardData }>(
        "/api/admin/dashboard",
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useAdminProfiles() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const res = await apiFetch<{ data: AdminProfileRow[] }>(
        "/api/admin/profiles",
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useUpdateProfileStatus() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      account_status,
    }: {
      profileId: string;
      account_status: AccountStatus;
    }) => {
      const res = await apiFetch<{ data: AdminProfileRow }>(
        `/api/admin/profiles/${profileId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ account_status }),
          ...authHeaders(getAccessToken()),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
