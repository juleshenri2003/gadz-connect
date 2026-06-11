import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export interface CampusNotificationItem {
  id: string;
  read_at: string | null;
  created_at: string;
  notification: {
    id: string;
    kind:
      | "prof_unavailable"
      | "student_unavailable"
      | "replacement_proposed"
      | "replacement_accepted"
      | "replacement_declined";
    title: string;
    message: string;
    scheduled_at: string | null;
    replacement_status: string;
    reason: string | null;
    created_at: string;
    course_id: string | null;
    declared_by?: string;
    subject?: string | null;
    campus: { name: string } | null;
    declarant: {
      first_name: string;
      last_name: string;
      role: string;
    } | null;
  } | null;
}

export function useNotifications() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: CampusNotificationItem[] }>(
        "/api/notifications",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
    refetchInterval: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { count: number } }>(
        "/api/notifications/unread-count",
        { token },
      );
      return res.data.count;
    },
    enabled: Boolean(user && getAccessToken()),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/notifications/${recipientId}/read`, {
        method: "PATCH",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useDeclareUnavailable() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { courseId: string; reason?: string }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { recipientsCount: number; title: string };
      }>("/api/notifications/declare-unavailable", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-admin"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["replacements-pending-student"] });
    },
  });
}
