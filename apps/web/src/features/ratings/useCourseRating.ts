import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CourseRatingProviderView,
} from "@gadz-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

interface SubmitCourseRatingInput {
  courseId: string;
  stars: number;
  comment?: string;
}

export function useSubmitCourseRating() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitCourseRatingInput) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");

      await apiFetch<{ data: { stars: number; createdAt: string } }>(
        `/api/students/courses/${input.courseId}/rating`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            stars: input.stars,
            comment: input.comment,
          }),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["course-evaluations"] });
      void queryClient.invalidateQueries({
        queryKey: ["course-evaluation-detail"],
      });
    },
  });
}

export interface TeacherRatingsSummary {
  average: number | null;
  count: number;
  items: CourseRatingProviderView[];
}

export function useTeacherRatings() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["teacher-ratings"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TeacherRatingsSummary }>(
        "/api/tutors/me/ratings",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}
