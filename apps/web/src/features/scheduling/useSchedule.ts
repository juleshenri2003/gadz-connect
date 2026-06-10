import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { ScheduleEvent } from "./types";

export function useMySchedule() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["schedule-me"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { role: string; events: ScheduleEvent[] };
      }>("/api/schedule/me", { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useAdminSchedule() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["schedule-admin"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { events: ScheduleEvent[] } }>(
        "/api/admin/schedule",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}
