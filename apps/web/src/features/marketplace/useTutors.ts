import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type { TutorProfileLink } from "@/features/profile/profileLinks";

export interface TutorListItem {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  bio: string | null;
  cv: string | null;
  has_cv_pdf: boolean;
  avatar_url?: string | null;
  hourly_rate: number | null;
  subjects: string[];
  profile_links?: TutorProfileLink[];
  account_status: string;
  campus: { name: string } | null;
  available_slot_count: number;
  next_available_slot_at: string | null;
}

export interface TutorSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  booked: boolean;
  client?: { first_name: string; last_name: string } | null;
}

export interface MarketplaceChecks {
  rate: boolean;
  futureSlots: boolean;
  stripe: boolean;
  profileSetup: boolean;
}

export interface MarketplaceStatus {
  visible: boolean;
  checks: MarketplaceChecks;
}

export interface MyTutorProfile {
  id: string;
  bio: string | null;
  cv: string | null;
  hourly_rate: number | null;
  subjects: string[];
  profile_links?: TutorProfileLink[];
  cv_complete?: boolean;
  marketplace?: MarketplaceStatus;
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
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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

export function useMyTutorProfile(options?: { enabled?: boolean }) {
  const { getAccessToken, user } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["tutor-me"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: MyTutorProfile }>("/api/tutors/me", { token });
      return res.data;
    },
    enabled: enabled && Boolean(user && getAccessToken()),
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
      cv?: string;
      hourlyRate?: number;
      subjects?: string[];
      profileLinks?: TutorProfileLink[];
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
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
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
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-financial"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
    },
  });
}

export function useDeleteSlot() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch(`/api/tutors/me/slots/${slotId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-financial"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
    },
  });
}

export interface BookingResult {
  requiresPayment: boolean;
  clientSecret?: string;
  courseId: string;
  amountGross: number;
  netPayout: number;
  subject: string;
  scheduledAt: string;
  endsAt: string;
  sessionType?: "standard" | "trial";
}

export function useBookSlot() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      slotId: string;
      subject?: string;
      payerName?: string;
      beneficiaryName?: string;
      sessionType?: "standard" | "trial";
    }) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: BookingResult }>("/api/tutors/bookings", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule-admin"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots", vars.slotId] });
    },
  });
}

export function useConfirmBookingPayment() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch<{ data: { courseId: string; status: string } }>(
        `/api/tutors/bookings/${courseId}/confirm-payment`,
        { method: "POST", token },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["my-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-transactions"] });
    },
  });
}
