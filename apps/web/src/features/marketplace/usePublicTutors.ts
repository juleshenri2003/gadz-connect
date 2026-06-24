import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface PublicTutorListItem {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  has_cv_pdf: boolean;
  avatar_url?: string | null;
  hourly_rate: number | null;
  subjects: string[];
  campus: { name: string } | null;
  available_slot_count: number;
  next_available_slot_at: string | null;
}

export interface PublicTutorSlot {
  id: string;
  starts_at: string;
  ends_at: string;
}

export interface PublicCampusStats {
  tutor_count: number;
  bookable_count: number;
  top_subjects: string[];
  avg_hourly_rate: number | null;
}

export interface PublicTutorQueryFilters {
  q?: string;
  subject?: string | null;
  bookable?: boolean;
}

function buildPublicTutorsUrl(
  campusId: string,
  filters?: PublicTutorQueryFilters,
): string {
  const params = new URLSearchParams();
  if (filters?.q?.trim()) params.set("q", filters.q.trim());
  if (filters?.subject) params.set("subject", filters.subject);
  if (filters?.bookable) params.set("bookable", "true");
  const qs = params.toString();
  return `/api/public/campus/${campusId}/tutors${qs ? `?${qs}` : ""}`;
}

export function usePublicTutors(
  campusId: string | null,
  filters?: PublicTutorQueryFilters,
) {
  return useQuery({
    queryKey: ["public-tutors", campusId, filters],
    queryFn: async () => {
      if (!campusId) throw new Error("Campus requis");
      const res = await apiFetch<{ data: PublicTutorListItem[] }>(
        buildPublicTutorsUrl(campusId, filters),
      );
      return res.data;
    },
    enabled: Boolean(campusId),
    staleTime: 30_000,
  });
}

export function usePublicCampusStats(campusId: string | null) {
  return useQuery({
    queryKey: ["public-campus-stats", campusId],
    queryFn: async () => {
      if (!campusId) throw new Error("Campus requis");
      const res = await apiFetch<{ data: PublicCampusStats }>(
        `/api/public/campus/${campusId}/stats`,
      );
      return res.data;
    },
    enabled: Boolean(campusId),
    staleTime: 30_000,
  });
}

export function usePublicTutor(campusId: string | null, tutorId: string) {
  return useQuery({
    queryKey: ["public-tutor", campusId, tutorId],
    queryFn: async () => {
      if (!campusId) throw new Error("Campus requis");
      const res = await apiFetch<{ data: PublicTutorListItem }>(
        `/api/public/campus/${campusId}/tutors/${tutorId}`,
      );
      return res.data;
    },
    enabled: Boolean(campusId && tutorId),
  });
}

export function usePublicTutorSlots(
  campusId: string | null,
  tutorId: string,
) {
  return useQuery({
    queryKey: ["public-tutor-slots", campusId, tutorId],
    queryFn: async () => {
      if (!campusId) throw new Error("Campus requis");
      const res = await apiFetch<{ data: PublicTutorSlot[] }>(
        `/api/public/campus/${campusId}/tutors/${tutorId}/slots`,
      );
      return res.data;
    },
    enabled: Boolean(campusId && tutorId),
  });
}
