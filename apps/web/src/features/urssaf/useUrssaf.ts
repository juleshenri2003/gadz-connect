import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UrssafClientStatus } from "@gadz-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export interface UrssafStatusResponse {
  operational: boolean;
  enrolled: boolean;
  status: UrssafClientStatus | null;
  activatedAt: string | null;
  urssafClientId: string | null;
}

export interface UrssafEnrollInput {
  birthDate: string;
  birthPlace: string;
  fiscalAddress: string;
  iban: string;
  nir?: string;
}

const STATUS_LABELS: Record<UrssafClientStatus, string> = {
  inscription_envoyee: "Inscription envoyée",
  rattachement_en_attente: "En attente de validation URSSAF",
  actif: "Actif — vous payez 50 %",
  refuse: "Refusé",
  expire: "Expiré",
};

export function urssafStatusLabel(
  status: UrssafClientStatus | null,
): string {
  if (!status) return "Non inscrit";
  return STATUS_LABELS[status];
}

export function useUrssafStatus() {
  const { getAccessToken, session } = useAuth();

  return useQuery({
    queryKey: ["urssaf-status"],
    enabled: Boolean(session),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: UrssafStatusResponse }>(
        "/api/urssaf/status",
        { token },
      );
      return res.data;
    },
    refetchInterval: (query) => {
      const clientStatus = query.state.data?.status;
      if (
        clientStatus === "rattachement_en_attente" ||
        clientStatus === "inscription_envoyee"
      ) {
        return 30_000;
      }
      return false;
    },
  });
}

export function useUrssafEnroll() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UrssafEnrollInput) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { status: UrssafClientStatus; message: string };
      }>("/api/urssaf/enroll", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["urssaf-status"] });
    },
  });
}
