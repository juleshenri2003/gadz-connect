import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export function useMarkInpiSent() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch("/api/profile/onboarding-milestone", {
        method: "PATCH",
        token,
        body: JSON.stringify({ milestone: "inpi_sent" }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}
