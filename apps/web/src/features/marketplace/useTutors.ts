import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export interface TutorListItem {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  bio: string | null;
  hourly_rate: number | null;
  subjects: string[];
  account_status: string;
  campus: { name: string } | null;
}

export interface TutorSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  booked: boolean;
}

export function useTutors() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["tutors"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TutorListItem[] }>("/api/tutors", {
        token,
      });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useTutor(id: string) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["tutor", id],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TutorListItem }>(`/api/tutors/${id}`, {
        token,
      });
      return res.data;
    },
    enabled: Boolean(id && getAccessToken()),
  });
}

export function useTutorSlots(tutorId: string) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["tutor-slots", tutorId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TutorSlot[] }>(
        `/api/tutors/${tutorId}/slots`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(tutorId && getAccessToken()),
  });
}

export function useMyTutorProfile() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["tutor-me"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          id: string;
          bio: string | null;
          hourly_rate: number | null;
          subjects: string[];
        };
      }>("/api/tutors/me", { token });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useMySlots() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["my-slots"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TutorSlot[] }>("/api/tutors/me/slots", {
        token,
      });
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useUpdateTutorProfile() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      bio?: string;
      hourlyRate?: number;
      subjects?: string[];
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch("/api/tutors/me", {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
    },
  });
}

export function useCreateSlot() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { startsAt: string; endsAt: string }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TutorSlot }>("/api/tutors/me/slots", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
    },
  });
}

export function useBookSlot() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { slotId: string; subject?: string }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: {
          courseId: string;
          amountGross: number;
          netPayout: number;
          subject: string;
          scheduledAt: string;
        };
      }>("/api/tutors/bookings", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots", vars.slotId] });
    },
  });
}
