import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type {
  CourseEvaluationDetail,
  CourseEvaluationListItem,
} from "./types";

export function fileToPdfBase64(file: File): Promise<string> {
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

export function useMyCourseEvaluations() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["course-evaluations"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: CourseEvaluationListItem[] }>(
        "/api/evaluations/me",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useCourseEvaluationDetail(courseId: string | null) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["course-evaluation-detail", courseId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !courseId) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: CourseEvaluationDetail }>(
        `/api/evaluations/courses/${courseId}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken() && courseId),
  });
}

export function usePostCourseMessage() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      body,
    }: {
      courseId: string;
      body: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/evaluations/courses/${courseId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["course-evaluation-detail", vars.courseId],
      });
      void queryClient.invalidateQueries({ queryKey: ["course-evaluations"] });
      void queryClient.invalidateQueries({
        queryKey: ["repository-folder-summaries"],
      });
    },
  });
}

export function usePostClarification() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      courseId: string;
      title: string;
      content?: string;
      pdfBase64?: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/evaluations/courses/${input.courseId}/clarifications`, {
        method: "POST",
        token,
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          pdfBase64: input.pdfBase64,
        }),
      });
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["course-evaluation-detail", vars.courseId],
      });
      void queryClient.invalidateQueries({ queryKey: ["course-evaluations"] });
      void queryClient.invalidateQueries({
        queryKey: ["repository-folder-summaries"],
      });
      void queryClient.invalidateQueries({ queryKey: ["repository-folders"] });
    },
  });
}

export function useUploadSummaryPdf() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      pdfBase64,
    }: {
      courseId: string;
      pdfBase64: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/evaluations/courses/${courseId}/summary/pdf`, {
        method: "POST",
        token,
        body: JSON.stringify({ pdfBase64 }),
      });
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["course-evaluation-detail", vars.courseId],
      });
      void queryClient.invalidateQueries({ queryKey: ["course-evaluations"] });
      void queryClient.invalidateQueries({
        queryKey: ["repository-folder-summaries"],
      });
    },
  });
}

export async function openEvaluationPdf(
  token: string,
  kind: "summary" | "clarification",
  id: string,
): Promise<void> {
  const path =
    kind === "summary"
      ? `/api/evaluations/summaries/${id}/pdf-url`
      : `/api/evaluations/clarifications/${id}/pdf-url`;
  const res = await apiFetch<{ data: { url: string } }>(path, { token });
  window.open(res.data.url, "_blank", "noopener,noreferrer");
}
