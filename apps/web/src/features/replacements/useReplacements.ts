import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export interface ReplacementProposal {
  id: string;
  notification_id: string;
  original_course_id: string;
  proposed_provider_id: string;
  message: string | null;
  status: string;
  created_at: string;
  proposed_provider: {
    first_name: string;
    last_name: string;
    bio: string | null;
    subjects: string[];
    hourly_rate: number | null;
  } | null;
}

export interface PendingReplacementAlert {
  id: string;
  subject: string | null;
  scheduled_at: string | null;
  course_id: string | null;
  pendingProposalsCount: number;
}

export function useReplacementProposals(notificationId: string | null) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["replacement-proposals", notificationId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !notificationId) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: ReplacementProposal[] }>(
        `/api/replacements/${notificationId}/proposals`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken() && notificationId),
  });
}

export function usePendingReplacementsForStudent() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["replacements-pending-student"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: PendingReplacementAlert[] }>(
        "/api/replacements/pending-for-student",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
    refetchInterval: 30_000,
  });
}

export function useReplacementMyResponse(notificationId: string | null) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["replacement-my-response", notificationId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !notificationId) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          status: string;
          proposalId?: string;
          message?: string | null;
        };
      }>(`/api/replacements/${notificationId}/my-response`, { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken() && notificationId),
  });
}

export function useDeclineReplacementOffer() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/replacements/${notificationId}/decline-offer`, {
        method: "POST",
        token,
      });
    },
    onSuccess: (_data, notificationId) => {
      void queryClient.invalidateQueries({
        queryKey: ["replacement-my-response", notificationId],
      });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
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
      const res = await apiFetch<{ data: { proposalId: string } }>(
        `/api/replacements/${notificationId}/propose`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ message }),
        },
      );
      return res.data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["replacement-my-response", vars.notificationId],
      });
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["replacements-pending-student"] });
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
      const res = await apiFetch<{ data: { courseId: string } }>(
        `/api/replacements/proposals/${proposalId}/accept`,
        { method: "POST", token },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["replacements-pending-student"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
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
      await apiFetch(`/api/replacements/proposals/${proposalId}/decline`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["replacement-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["replacements-pending-student"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDismissReplacement() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/replacements/${notificationId}/dismiss`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
    },
  });
}
