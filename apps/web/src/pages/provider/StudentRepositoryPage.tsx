import { Button } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { RepositoryFoldersSkeleton } from "@/features/repository/RepositoryPageSkeleton";
import { StudentRecentSummariesBanner } from "@/features/repository/StudentRecentSummariesBanner";
import { StudentRepositoryEmptyState } from "@/features/repository/StudentRepositoryEmptyState";
import { StudentRepositoryFolderCard } from "@/features/repository/StudentRepositoryFolderCard";
import { formatRepositoryDate } from "@/features/repository/studentRepositoryUtils";
import {
  useRecentSummaries,
  useRepositoryFolders,
} from "@/features/repository/useRepository";

export { StudentRepositoryFolderPage } from "./StudentRepositoryFolderPage";

type FolderSort = "recent" | "alpha";

export function StudentRepositoryPage() {
  const { data: profile } = useMyProfile();
  if (profile && !isStudent(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  const {
    data: folders,
    isLoading,
    isError,
    refetch,
  } = useRepositoryFolders();
  const { data: recentSummaries } = useRecentSummaries(5);
  const [sort, setSort] = useState<FolderSort>("recent");
  const [showEmptyFolders, setShowEmptyFolders] = useState(false);

  const visibleFolders = useMemo(() => {
    let list = folders ?? [];
    if (!showEmptyFolders) {
      list = list.filter((folder) => folder.summaryCount > 0);
    }
    if (sort === "alpha") {
      list = [...list].sort((a, b) =>
        a.subject.localeCompare(b.subject, "fr"),
      );
    }
    return list;
  }, [folders, showEmptyFolders, sort]);

  const totalSummaries = (folders ?? []).reduce(
    (sum, folder) => sum + folder.summaryCount,
    0,
  );
  const latestSummaryAt = (folders ?? []).reduce<string | null>(
    (latest, folder) => {
      if (!folder.lastSummaryAt) return latest;
      if (!latest) return folder.lastSummaryAt;
      return new Date(folder.lastSummaryAt) > new Date(latest)
        ? folder.lastSummaryAt
        : latest;
    },
    null,
  );

  const hasAnyFolder = (folders?.length ?? 0) > 0;
  const hasVisibleFolders = visibleFolders.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Comptes-rendus</h2>
        <p className="mt-1 text-sm text-ink-600">
          Résumés de cours déposés par vos professeurs, classés par matière
        </p>
        {totalSummaries > 0 && latestSummaryAt ? (
          <p className="mt-2 text-sm text-ink-400">
            {totalSummaries} résumé{totalSummaries !== 1 ? "s" : ""} · dernière
            publication le {formatRepositoryDate(latestSummaryAt)}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <RepositoryFoldersSkeleton />
      ) : isError ? (
        <div className="rounded-md border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          <p>Impossible de charger vos comptes-rendus.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : !hasAnyFolder ? (
        <StudentRepositoryEmptyState />
      ) : (
        <>
          {recentSummaries && recentSummaries.length > 0 ? (
            <StudentRecentSummariesBanner summaries={recentSummaries} />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={sort === "recent" ? "default" : "outline"}
                onClick={() => setSort("recent")}
              >
                Plus récent
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sort === "alpha" ? "default" : "outline"}
                onClick={() => setSort("alpha")}
              >
                Par matière
              </Button>
            </div>
            {(folders ?? []).some((f) => f.summaryCount === 0) ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  className="rounded border-line"
                  checked={showEmptyFolders}
                  onChange={(e) => setShowEmptyFolders(e.target.checked)}
                />
                Afficher les matières sans résumé
              </label>
            ) : null}
          </div>

          {hasVisibleFolders ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleFolders.map((folder) => (
                <StudentRepositoryFolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">
              Aucune matière avec résumé pour le moment.{" "}
              <Link
                to="/app/cours"
                className="font-medium text-brand-700 hover:underline"
              >
                Réserver un cours →
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
