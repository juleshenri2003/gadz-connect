import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { AdminMe } from "./types";

/** Vérifie l'accès RH via l'API (e-mail autorisé + rôle admin). */
export function useRhAccess() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["rh-access", user?.id],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");

      const res = await apiFetch<{ data: AdminMe }>("/api/admin/me", {
        token,
      });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
    retry: false,
  });
}
