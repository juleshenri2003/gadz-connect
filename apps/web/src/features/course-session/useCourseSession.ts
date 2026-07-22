import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { ScheduleEvent } from "@/features/scheduling/types";

const CONFIRM_ALERT_KINDS = new Set([
  "course_confirmation_reminder",
  "course_confirmation_escalation",
  "session_confirm_reminder",
]);

function patchScheduleEventAfterAttendance(
  events: ScheduleEvent[],
  courseId: string,
  data: {
    student_session_confirmed_at: string | null;
    provider_session_confirmed_at: string | null;
    session_confirmation_completed_at: string | null;
  },
): ScheduleEvent[] {
  return events.map((event) => {
    if (event.courseId !== courseId) return event;
    return {
      ...event,
      studentSessionConfirmedAt: data.student_session_confirmed_at,
      providerSessionConfirmedAt: data.provider_session_confirmed_at,
      sessionConfirmationCompletedAt: data.session_confirmation_completed_at,
      studentConfirmedAt:
        data.student_session_confirmed_at ?? event.studentConfirmedAt,
      providerConfirmedAt:
        data.provider_session_confirmed_at ?? event.providerConfirmedAt,
      status: data.session_confirmation_completed_at
        ? "completed"
        : event.status === "scheduled"
          ? "awaiting_session_confirmation"
          : event.status,
    };
  });
}

export function useConfirmSession() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          id: string;
          student_confirmed_at: string | null;
          provider_confirmed_at: string | null;
        };
      }>(`/api/courses/${courseId}/confirm-session`, {
        method: "POST",
        token,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useConfirmAttendance() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          id: string;
          student_session_confirmed_at: string | null;
          provider_session_confirmed_at: string | null;
          session_confirmation_completed_at: string | null;
          session_dispute_status?: string | null;
          payout?: {
            ok?: boolean;
            error?: string;
            alreadyCompleted?: boolean;
          } | null;
        };
      }>(`/api/courses/${courseId}/confirm-attendance`, {
        method: "POST",
        token,
      });
      return res.data;
    },
    onSuccess: (data, courseId) => {
      // Mise à jour immédiate : l'inbox « À faire » disparaît sans attendre le refetch.
      queryClient.setQueriesData<{ role?: string; events: ScheduleEvent[] }>(
        { queryKey: ["schedule-me"] },
        (old) => {
          if (!old?.events) return old;
          return {
            ...old,
            events: patchScheduleEventAfterAttendance(old.events, courseId, data),
          };
        },
      );

      const notifications = queryClient.getQueryData<CampusNotificationItem[]>([
        "notifications",
      ]);
      const toMark =
        notifications?.filter(
          (item) =>
            !item.read_at &&
            item.notification?.course_id === courseId &&
            item.notification?.kind &&
            CONFIRM_ALERT_KINDS.has(item.notification.kind),
        ) ?? [];

      if (toMark.length > 0) {
        const now = new Date().toISOString();
        queryClient.setQueryData<CampusNotificationItem[]>(
          ["notifications"],
          (old) =>
            old?.map((item) =>
              toMark.some((m) => m.id === item.id)
                ? { ...item, read_at: now }
                : item,
            ) ?? old,
        );
        const token = getAccessToken();
        if (token) {
          for (const item of toMark) {
            void apiFetch(`/api/notifications/${item.id}/read`, {
              method: "PATCH",
              token,
            }).catch(() => {
              /* refetch will reconcile */
            });
          }
        }
      }

      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      void queryClient.invalidateQueries({
        queryKey: ["tutors-me-transactions"],
      });
    },
  });
}

export function usePingSession() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      message,
    }: {
      courseId: string;
      message?: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/courses/${courseId}/ping-session`, {
        method: "POST",
        token,
        body: JSON.stringify({ message }),
      });
    },
  });
}

export function useReplacementProposals(courseId: string | null) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["replacement-proposals", courseId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !courseId) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: Array<{
          id: string;
          status: string;
          message: string | null;
          created_at: string;
          proposed_provider: {
            id: string;
            first_name: string;
            last_name: string;
          } | null;
        }>;
      }>(`/api/courses/${courseId}/replacement-proposals`, { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken() && courseId),
  });
}

export function useProposeReplacement() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      message,
    }: {
      notificationId: string;
      message?: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(
        `/api/replacement/notifications/${notificationId}/propose`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ message }),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAcceptReplacement() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/replacement/proposals/${proposalId}/accept`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
    },
  });
}

export function useDeclineReplacement() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/replacement/proposals/${proposalId}/decline`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
    },
  });
}
