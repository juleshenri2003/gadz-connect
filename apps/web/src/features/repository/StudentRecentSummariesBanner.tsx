import { Link } from "react-router-dom";
import type { RecentRepositoryMaterial } from "@/features/repository/useRepository";
import {
  clarificationDeepLink,
  formatProviderName,
  formatRepositoryDate,
  getFolderSubject,
  getSessionDateIso,
  summaryDeepLink,
} from "./studentRepositoryUtils";

interface StudentRecentSummariesBannerProps {
  materials: RecentRepositoryMaterial[];
}

export function StudentRecentSummariesBanner({
  materials,
}: StudentRecentSummariesBannerProps) {
  if (materials.length === 0) return null;

  return (
    <section className="rounded-md border border-brand-100 bg-brand-50/40 p-5">
      <h3 className="font-semibold text-ink-900">Derniers documents</h3>
      <p className="mt-1 text-sm text-ink-600">
        Comptes-rendus et fiches complémentaires, toutes matières.
      </p>
      <ul className="mt-4 space-y-2">
        {materials.map((material) => {
          const sessionIso = getSessionDateIso(material);
          const folderSubject = getFolderSubject(material.folder);
          const isClarification = material.kind === "clarification";
          const publishedAt = isClarification
            ? material.created_at
            : material.published_at;
          const href = isClarification
            ? clarificationDeepLink(material.folder_id, material.id)
            : summaryDeepLink(material.folder_id, material.id);

          return (
            <li key={`${material.kind}-${material.id}`}>
              <Link
                to={href}
                className="block rounded-lg border border-surface/80 bg-surface px-3 py-2 text-sm transition hover:border-brand-100 hover:shadow-surface"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink-900">
                    {material.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {isClarification ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Fiche
                      </span>
                    ) : null}
                    {folderSubject ? (
                      <span className="text-xs text-brand-600">
                        {folderSubject}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  {sessionIso
                    ? `Séance du ${formatRepositoryDate(sessionIso)}`
                    : `Déposé le ${formatRepositoryDate(publishedAt)}`}
                  {" · "}
                  {formatProviderName(material.provider)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
