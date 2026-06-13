import { Link } from "react-router-dom";
import type { RecentCourseSummary } from "@/features/repository/useRepository";
import {
  formatProviderName,
  formatRepositoryDate,
  getFolderSubject,
  getSessionDateIso,
  summaryDeepLink,
} from "./studentRepositoryUtils";

interface StudentRecentSummariesBannerProps {
  summaries: RecentCourseSummary[];
}

export function StudentRecentSummariesBanner({
  summaries,
}: StudentRecentSummariesBannerProps) {
  if (summaries.length === 0) return null;

  return (
    <section className="rounded-md border border-brand-100 bg-brand-50/40 p-5">
      <h3 className="font-semibold text-ink-900">Derniers comptes-rendus</h3>
      <p className="mt-1 text-sm text-ink-600">
        Les résumés les plus récents, toutes matières.
      </p>
      <ul className="mt-4 space-y-2">
        {summaries.map((summary) => {
          const sessionIso = getSessionDateIso(summary);
          const folderSubject = getFolderSubject(summary.folder);

          return (
            <li key={summary.id}>
              <Link
                to={summaryDeepLink(summary.folder_id, summary.id)}
                className="block rounded-lg border border-surface/80 bg-surface px-3 py-2 text-sm transition hover:border-brand-100 hover:shadow-surface"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink-900">
                    {summary.title}
                  </span>
                  {folderSubject ? (
                    <span className="text-xs text-brand-600">{folderSubject}</span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  {sessionIso
                    ? `Séance du ${formatRepositoryDate(sessionIso)}`
                    : `Publié le ${formatRepositoryDate(summary.published_at)}`}
                  {" · "}
                  {formatProviderName(summary.provider)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
