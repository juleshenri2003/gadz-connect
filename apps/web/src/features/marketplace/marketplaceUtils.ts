import type { TutorListItem } from "./useTutors";

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

export function sortTutorsByAvailability(tutors: TutorListItem[]): TutorListItem[] {
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

export function collectSubjectOptions(tutors: TutorListItem[]): string[] {
  const subjects = new Set<string>();
  for (const tutor of tutors) {
    for (const subject of tutor.subjects) {
      if (subject.trim()) subjects.add(subject.trim());
    }
  }
  return [...subjects].sort((a, b) => a.localeCompare(b, "fr"));
}

export function filterTutors(
  tutors: TutorListItem[],
  query: string,
  subject: string | null,
): TutorListItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tutors.filter((tutor) => {
    if (subject && !tutor.subjects.includes(subject)) return false;
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

export function countBookableTutors(tutors: TutorListItem[]): number {
  return tutors.filter((t) => (t.available_slot_count ?? 0) > 0).length;
}
