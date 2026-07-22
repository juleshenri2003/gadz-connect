import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountStatus } from "@gadz-connect/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";
import type { AdminDashboardData, AdminMe, AdminProfileDetail, AdminProfileRow, AdminProfilesMeta, AdminProfilesQueryParams, AdminBudgetData, AdminBudgetQueryParams, AdminTransactionRow, AdminTransactionsMeta, AdminTransactionsQueryParams, AdminCourseDetail, AdminCourseRow, AdminCoursesMeta, AdminCoursesQueryParams, AdminCoursesSummary } from "./types";

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

export function useAdminDashboard(enabled = true) {
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
    enabled: Boolean(getAccessToken()) && enabled,
  });
}

export function useAdminBudgets(params?: AdminBudgetQueryParams) {
  const { getAccessToken } = useAuth();

  const queryString = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, String(value)]),
      ).toString()
    : "";

  return useQuery({
    queryKey: ["admin-budgets", params ?? "default"],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/budgets?${queryString}`
        : "/api/admin/budgets";
      const res = await apiFetch<{ data: AdminBudgetData }>(
        path,
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useAdminTransactions(
  params?: AdminTransactionsQueryParams,
  options?: { enabled?: boolean },
) {
  const { getAccessToken } = useAuth();

  const queryString = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, String(value)]),
      ).toString()
    : "";

  return useQuery({
    queryKey: ["admin-transactions", params ?? "default"],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/transactions?${queryString}`
        : "/api/admin/transactions";
      const res = await apiFetch<{
        data: AdminTransactionRow[];
        meta?: AdminTransactionsMeta;
      }>(path, authHeaders(getAccessToken()));
      return {
        transactions: res.data,
        meta: res.meta ?? {
          total: res.data.length,
          page: 1,
          pageSize: res.data.length,
        },
      };
    },
    enabled: Boolean(getAccessToken()) && (options?.enabled ?? true),
  });
}

export function useAdminProfiles(params?: AdminProfilesQueryParams) {
  const { getAccessToken } = useAuth();

  const queryString = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, String(value)]),
      ).toString()
    : "";

  return useQuery({
    queryKey: ["admin-profiles", params ?? "all"],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/profiles?${queryString}`
        : "/api/admin/profiles";
      const res = await apiFetch<{
        data: AdminProfileRow[];
        meta?: AdminProfilesMeta;
      }>(path, authHeaders(getAccessToken()));
      return {
        profiles: res.data,
        meta: res.meta ?? {
          total: res.data.length,
          page: 1,
          pageSize: res.data.length,
        },
      };
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useAdminProfileDetail(profileId: string | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-profile", profileId],
    queryFn: async () => {
      const res = await apiFetch<{ data: AdminProfileDetail }>(
        `/api/admin/profiles/${profileId}`,
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()) && Boolean(profileId),
  });
}

export function useAdminCampuses() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-campuses"],
    queryFn: async () => {
      const res = await apiFetch<{
        data: Array<{ id: string; name: string }>;
      }>("/api/admin/campuses", authHeaders(getAccessToken()));
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
      const res = await apiFetch<{ data: AdminProfileDetail }>(
        `/api/admin/profiles/${profileId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ account_status }),
          ...authHeaders(getAccessToken()),
        },
      );
      return res.data;
    },
    onSuccess: (updated, { profileId }) => {
      queryClient.setQueriesData(
        { queryKey: ["admin-profiles"] },
        (
          old:
            | { profiles: AdminProfileRow[]; meta: AdminProfilesMeta }
            | undefined,
        ) => {
          if (!old?.profiles) return old;
          return {
            ...old,
            profiles: old.profiles.map((profile) =>
              profile.id === profileId ? { ...profile, ...updated } : profile,
            ),
          };
        },
      );
      queryClient.setQueryData(["admin-profile", profileId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-profile", profileId],
      });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
    },
  });
}

function buildAdminCoursesQueryString(
  params?: AdminCoursesQueryParams,
): string {
  if (!params) return "";
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      entries.push([key, String(value)]);
    }
  }
  return new URLSearchParams(entries).toString();
}

export function useAdminCourses(params?: AdminCoursesQueryParams) {
  const { getAccessToken } = useAuth();
  const queryString = buildAdminCoursesQueryString(params);

  return useQuery({
    queryKey: ["admin-courses", params ?? "all"],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/courses?${queryString}`
        : "/api/admin/courses";
      const res = await apiFetch<{
        data: AdminCourseRow[];
        meta?: AdminCoursesMeta;
      }>(path, authHeaders(getAccessToken()));
      return {
        courses: res.data,
        meta: res.meta ?? {
          total: res.data.length,
          page: 1,
          pageSize: res.data.length,
        },
      };
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useAdminCoursesSummary(campusId?: string) {
  const { getAccessToken } = useAuth();
  const queryString = campusId
    ? new URLSearchParams({ campus_id: campusId }).toString()
    : "";

  return useQuery({
    queryKey: ["admin-courses-summary", campusId ?? "all"],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/courses/summary?${queryString}`
        : "/api/admin/courses/summary";
      const res = await apiFetch<{ data: AdminCoursesSummary }>(
        path,
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useAdminCourseDetail(courseId: string | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: async () => {
      const res = await apiFetch<{ data: AdminCourseDetail }>(
        `/api/admin/courses/${courseId}`,
        authHeaders(getAccessToken()),
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()) && Boolean(courseId),
  });
}
