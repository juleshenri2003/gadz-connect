import type { StudentLearningProfile } from "@gadz-connect/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export function useStudentLearningProfile(enabled = true) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["student-learning-profile"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: StudentLearningProfile | null }>(
        "/api/profile/student-learning-profile",
        { token },
      );
      return res.data;
    },
    enabled,
  });
}

export function useStudentLearningProfileForStudent(
  studentId: string | null | undefined,
  enabled = true,
) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["student-learning-profile", studentId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !studentId) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: StudentLearningProfile }>(
        `/api/students/${studentId}/learning-profile`,
        { token },
      );
      return res.data;
    },
    enabled: enabled && Boolean(studentId),
    retry: false,
  });
}

export interface StudentLearningProfileFormInput {
  classYear: string;
  studyProgram?: string;
  strongPoints: string;
  difficulties: string;
  learningFlags: string[];
  learningFlagsOther?: string;
  tutoringGoals: string;
}

export function useSaveStudentLearningProfile() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: StudentLearningProfileFormInput) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: StudentLearningProfile }>(
        "/api/profile/student-learning-profile",
        {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-learning-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });
}

export function useTutorTrialEligibility(tutorId: string | undefined) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["tutor-trial-eligibility", tutorId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !tutorId) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { eligible: boolean; reason?: string };
      }>(`/api/tutors/${tutorId}/trial-eligibility`, { token });
      return res.data;
    },
    enabled: Boolean(tutorId),
  });
}
