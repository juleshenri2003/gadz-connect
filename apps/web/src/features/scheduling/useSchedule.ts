import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type {
  AdminScheduleQueryOptions,
  AdminScheduleSummary,
  ScheduleEvent,
  ScheduleQueryOptions,
} from "./types";

function buildScheduleQuery(params?: ScheduleQueryOptions): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.includeCancelled) search.set("includeCancelled", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function buildAdminScheduleQuery(params?: AdminScheduleQueryOptions): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.campusId) search.set("campusId", params.campusId);
  if (params.search) search.set("search", params.search);
  if (params.includeCancelled) search.set("includeCancelled", "true");
  if (params.status?.length) search.set("status", params.status.join(","));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function useMySchedule(params?: ScheduleQueryOptions) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["schedule-me", params?.from, params?.to, params?.includeCancelled],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { role: string; events: ScheduleEvent[] };
      }>(`/api/schedule/me${buildScheduleQuery(params)}`, { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useAdminSchedule(params?: AdminScheduleQueryOptions) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: [
      "schedule-admin",
      params?.from,
      params?.to,
      params?.campusId,
      params?.status?.join(","),
      params?.includeCancelled,
      params?.search,
    ],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { events: ScheduleEvent[] } }>(
        `/api/admin/schedule${buildAdminScheduleQuery(params)}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useAdminScheduleSummary(
  params?: Pick<AdminScheduleQueryOptions, "from" | "to" | "campusId">,
) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: [
      "schedule-admin-summary",
      params?.from,
      params?.to,
      params?.campusId,
    ],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const search = new URLSearchParams();
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      if (params?.campusId) search.set("campusId", params.campusId);
      const qs = search.toString();
      const res = await apiFetch<{ data: AdminScheduleSummary }>(
        `/api/admin/schedule/summary${qs ? `?${qs}` : ""}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}
