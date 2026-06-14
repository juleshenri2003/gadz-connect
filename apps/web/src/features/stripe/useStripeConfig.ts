import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface StripeConfig {
  configured: boolean;
  publishableKey: string | null;
}

export function useStripeConfig() {
  return useQuery({
    queryKey: ["stripe-config"],
    queryFn: async () => {
      const res = await apiFetch<{ data: StripeConfig }>("/api/stripe/config");
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
  });
}
