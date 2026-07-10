/** Forme minimale partagée entre marketplace auth et public. */
import type { TutorProfileLink } from "@/features/profile/profileLinks";
import {
  collectHomepageSubjectOptions,
  normalizeMarketplaceSubject,
  tutorTeachesCatalogSubject,
} from "./marketplaceSubjects";

export interface MarketplaceTutorBase {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  hourly_rate: number | null;
  subjects: string[];
  profile_links?: TutorProfileLink[];
  available_slot_count?: number;
  next_available_slot_at?: string | null;
  has_cv_pdf?: boolean;
  avatar_url?: string | null;
  cv?: string | null;
}

export function formatSlotRange(starts: string, ends: string): string {
  const start = new Date(starts);
  const end = new Date(ends);
  return `${start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function slotDurationHours(starts: string, ends: string): number {
  return (
    (new Date(ends).getTime() - new Date(starts).getTime()) / (1000 * 60 * 60)
  );
}

export function isTrialSlotDuration(starts: string, ends: string): boolean {
  return slotDurationHours(starts, ends) <= 1.001;
}

export function formatSlotDuration(starts: string, ends: string): string {
  const minutes =
    (new Date(ends).getTime() - new Date(starts).getTime()) / (1000 * 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? `${hours} h`
    : `${hours.toFixed(1).replace(".", ",")} h`;
}

export function computeSlotPrice(
  hourlyRate: number,
  startsAt: string,
  endsAt: string,
): number {
  const durationHours =
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) /
    (1000 * 60 * 60);
  return Math.round(hourlyRate * durationHours * 100) / 100;
}

export function formatNextSlot(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} · ${date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function sortTutorsByAvailability<T extends MarketplaceTutorBase>(
  tutors: T[],
): T[] {
  return [...tutors].sort((a, b) => {
    const aCount = a.available_slot_count ?? 0;
    const bCount = b.available_slot_count ?? 0;
    if (aCount > 0 && bCount === 0) return -1;
    if (bCount > 0 && aCount === 0) return 1;
    if (aCount > 0 && bCount > 0) {
      const aNext = a.next_available_slot_at
        ? new Date(a.next_available_slot_at).getTime()
        : Infinity;
      const bNext = b.next_available_slot_at
        ? new Date(b.next_available_slot_at).getTime()
        : Infinity;
      if (aNext !== bNext) return aNext - bNext;
    }
    return a.last_name.localeCompare(b.last_name, "fr");
  });
}

export { collectHomepageSubjectOptions } from "./marketplaceSubjects";

export function collectSubjectOptions<T extends MarketplaceTutorBase>(
  tutors: T[],
): string[] {
  return collectHomepageSubjectOptions(tutors);
}

export function filterTutors<T extends MarketplaceTutorBase>(
  tutors: T[],
  query: string,
  subject: string | null,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tutors.filter((tutor) => {
    if (subject && !tutorTeachesCatalogSubject(tutor.subjects, subject)) {
      return false;
    }
    if (!normalizedQuery) return true;
    const name = `${tutor.first_name} ${tutor.last_name}`.toLowerCase();
    const bio = (tutor.bio ?? "").toLowerCase();
    const subjectsText = tutor.subjects.join(" ").toLowerCase();
    return (
      name.includes(normalizedQuery) ||
      bio.includes(normalizedQuery) ||
      subjectsText.includes(normalizedQuery)
    );
  });
}

export function countBookableTutors<T extends MarketplaceTutorBase>(
  tutors: T[],
): number {
  return tutors.filter((t) => (t.available_slot_count ?? 0) > 0).length;
}

export function filterBookableTutors<T extends MarketplaceTutorBase>(
  tutors: T[],
): T[] {
  return tutors.filter((t) => (t.available_slot_count ?? 0) > 0);
}

export function collectTopSubjects<T extends MarketplaceTutorBase>(
  tutors: T[],
  limit = 3,
): string[] {
  const counts = new Map<string, number>();
  for (const tutor of tutors) {
    const seen = new Set<string>();
    for (const subject of tutor.subjects) {
      const normalized = normalizeMarketplaceSubject(subject);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"),
    )
    .slice(0, limit)
    .map(([subject]) => subject);
}
