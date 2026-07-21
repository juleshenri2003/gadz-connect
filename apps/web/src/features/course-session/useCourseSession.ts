import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

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
          payout?: { ok?: boolean; error?: string; alreadyCompleted?: boolean } | null;
        };
      }>(`/api/courses/${courseId}/confirm-attendance`, {
        method: "POST",
        token,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors-me-transactions"] });
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
