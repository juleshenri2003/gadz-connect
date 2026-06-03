import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";

interface ConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export function useStripeConnectStatus() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: ConnectStatus }>(
        "/api/stripe/connect/status",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useCreateStripeConnectAccount() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { accountId: string } }>(
        "/api/stripe/connect/account",
        { method: "POST", token },
      );
      return res.data.accountId;
    },
  });
}

export function useStripeOnboardingLink() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { url: string } }>(
        "/api/stripe/connect/onboarding-link",
        {
          method: "POST",
          token,
          body: JSON.stringify({ accountId }),
        },
      );
      return res.data.url;
    },
  });
}
