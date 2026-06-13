export const SUMMARY_PREVIEW_LENGTH = 400;

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function summaryDeepLink(folderId: string, summaryId: string): string {
  return `/app/repertoire/${folderId}#summary-${summaryId}`;
}

export function planningWeekLink(startsAt: string): string {
  const day = startsAt.slice(0, 10);
  return `/app/planning?week=${day}`;
}

export function formatRepositoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatProviderName(
  provider?: { first_name: string; last_name: string } | null,
): string {
  if (!provider) return "Professeur";
  return `${provider.first_name} ${provider.last_name}`.trim() || "Professeur";
}

export function truncateContent(
  content: string,
  max = SUMMARY_PREVIEW_LENGTH,
): { text: string; truncated: boolean } {
  if (content.length <= max) {
    return { text: content, truncated: false };
  }
  return { text: `${content.slice(0, max).trimEnd()}…`, truncated: true };
}

export function getSessionDateIso(
  summary: {
    course?: { scheduled_at: string | null } | { scheduled_at: string | null }[] | null;
  },
  fallbackStartsAt?: string,
): string | null {
  const course = pickOne(summary.course);
  const scheduled = course?.scheduled_at;
  if (scheduled) return scheduled;
  return fallbackStartsAt ?? null;
}

export function getFolderSubject(
  folder?:
    | { subject: string }
    | { subject: string }[]
    | null,
): string | null {
  const row = pickOne(folder ?? null);
  return row?.subject ?? null;
}
