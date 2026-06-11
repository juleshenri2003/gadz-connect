import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

export function useUploadCvPdf() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      if (file.type !== "application/pdf") {
        throw new Error("Format accepté : PDF uniquement");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Fichier trop volumineux — maximum 5 Mo");
      }
      const pdfBase64 = await fileToBase64(file);
      const res = await apiFetch<{ data: { cv_pdf_path: string } }>(
        "/api/profile/cv-pdf",
        {
          method: "POST",
          token,
          body: JSON.stringify({ pdfBase64 }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      void queryClient.invalidateQueries({ queryKey: ["my-cv-pdf-url"] });
    },
  });
}

export function useDeleteCvPdf() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch("/api/profile/cv-pdf", { method: "DELETE", token });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["my-cv-pdf-url"] });
    },
  });
}

export function useMyCvPdfUrl(enabled: boolean) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["my-cv-pdf-url"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { url: string } }>(
        "/api/profile/cv-pdf/url",
        { token },
      );
      return res.data.url;
    },
    enabled: Boolean(enabled && getAccessToken()),
    staleTime: 30 * 60 * 1000,
  });
}

export function useTutorCvPdfUrl(tutorId: string, hasPdf: boolean) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["tutor-cv-pdf-url", tutorId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { url: string } }>(
        `/api/tutors/${tutorId}/cv-pdf/url`,
        { token },
      );
      return res.data.url;
    },
    enabled: Boolean(tutorId && hasPdf && getAccessToken()),
    staleTime: 30 * 60 * 1000,
  });
}
