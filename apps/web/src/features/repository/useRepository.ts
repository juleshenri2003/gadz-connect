import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export interface SubjectFolder {
  id: string;
  subject: string;
  created_at: string;
  summaryCount: number;
  lastSummaryAt: string | null;
  latestTitle: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  content: string;
  published_at: string;
  course_id: string;
  folder_id?: string;
  provider?: { first_name: string; last_name: string } | null;
  course?: { scheduled_at: string | null } | null;
}

export interface RecentCourseSummary extends CourseSummary {
  folder_id: string;
  folder?: { id: string; subject: string } | null;
}

export interface CourseToDocument {
  id: string;
  subject: string | null;
  title: string;
  scheduled_at: string | null;
  status: string;
  client: { first_name: string; last_name: string } | null;
}

export function useRepositoryFolders() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["repository-folders"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: SubjectFolder[] }>(
        "/api/repository/folders",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useFolderSummaries(folderId: string | null) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["repository-folder-summaries", folderId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !folderId) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          folder: { id: string; subject: string };
          summaries: CourseSummary[];
        };
      }>(`/api/repository/folders/${folderId}/summaries`, { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken() && folderId),
  });
}

export function useRecentSummaries(limit = 5) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["repository-recent-summaries", limit],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: RecentCourseSummary[] }>(
        `/api/repository/summaries/recent?limit=${limit}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useCoursesToDocument() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["courses-to-document"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: CourseToDocument[] }>(
        "/api/repository/courses/to-document",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useSubmitCourseSummary() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      title,
      content,
    }: {
      courseId: string;
      title: string;
      content: string;
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: CourseSummary }>(
        `/api/repository/courses/${courseId}/summary`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ title, content }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses-to-document"] });
      void queryClient.invalidateQueries({ queryKey: ["repository-folders"] });
      void queryClient.invalidateQueries({
        queryKey: ["repository-folder-summaries"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["repository-recent-summaries"],
      });
    },
  });
}
