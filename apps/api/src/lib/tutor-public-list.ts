import type { TutorRowWithAvailability } from "./tutor-query.js";

export interface PublicCampusStats {
  tutor_count: number;
  bookable_count: number;
  top_subjects: string[];
  avg_hourly_rate: number | null;
}

export interface PublicTutorListQuery {
  q?: string;
  subject?: string;
  bookable?: boolean;
}

export function filterPublicTutorRows(
  rows: TutorRowWithAvailability[],
  query: PublicTutorListQuery,
): TutorRowWithAvailability[] {
  let result = rows;

  if (query.bookable) {
    result = result.filter((row) => row.available_slot_count > 0);
  }

  if (query.subject) {
    result = result.filter((row) =>
      (row.subjects ?? []).includes(query.subject!),
    );
  }

  const normalizedQuery = query.q?.trim().toLowerCase();
  if (normalizedQuery) {
    result = result.filter((row) => {
      const name = `${row.first_name} ${row.last_name}`.toLowerCase();
      const bio = (row.bio ?? "").toLowerCase();
      const subjects = (row.subjects ?? []).join(" ").toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        bio.includes(normalizedQuery) ||
        subjects.includes(normalizedQuery)
      );
    });
  }

  return result;
}

export function computePublicCampusStats(
  rows: TutorRowWithAvailability[],
): PublicCampusStats {
  const bookable = rows.filter((row) => row.available_slot_count > 0);
  const subjectCounts = new Map<string, number>();

  for (const row of rows) {
    for (const subject of row.subjects ?? []) {
      const trimmed = subject.trim();
      if (trimmed) {
        subjectCounts.set(trimmed, (subjectCounts.get(trimmed) ?? 0) + 1);
      }
    }
  }

  const top_subjects = [...subjectCounts.entries()]
    .sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"),
    )
    .slice(0, 5)
    .map(([subject]) => subject);

  const rates = rows
    .map((row) => row.hourly_rate)
    .filter((rate): rate is number => rate != null && rate > 0);

  const avg_hourly_rate =
    rates.length > 0
      ? Math.round(
          (rates.reduce((sum, rate) => sum + rate, 0) / rates.length) * 100,
        ) / 100
      : null;

  return {
    tutor_count: rows.length,
    bookable_count: bookable.length,
    top_subjects,
    avg_hourly_rate,
  };
}
