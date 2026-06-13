import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { apiFetch } from "@/lib/api";

export function useMarkInpiSent() {
  const { getAccessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["profile-me", user?.id] as const;

  return useMutation({
    mutationFn: async (sent: boolean | void) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { inpi_declaration_sent_at: string | null };
      }>("/api/profile/onboarding-milestone", {
        method: "PATCH",
        token,
        body: JSON.stringify({ milestone: "inpi_sent", value: sent ?? true }),
      });
      return res.data;
    },
    onMutate: async (sent) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MyProfile>(queryKey);
      const value = sent ?? true;
      if (previous) {
        queryClient.setQueryData<MyProfile>(queryKey, {
          ...previous,
          inpi_declaration_sent_at: value ? new Date().toISOString() : null,
        });
      }
      return { previous };
    },
    onError: (_err, _sent, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      const current = queryClient.getQueryData<MyProfile>(queryKey);
      if (current) {
        queryClient.setQueryData<MyProfile>(queryKey, {
          ...current,
          inpi_declaration_sent_at: data.inpi_declaration_sent_at,
        });
      }
    },
  });
}
