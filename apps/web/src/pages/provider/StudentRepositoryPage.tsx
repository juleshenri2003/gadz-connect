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
import { useMarkRepositoryDocumentAlertsRead } from "@/features/repository/useMarkRepositoryDocumentAlertsRead";
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

  useMarkRepositoryDocumentAlertsRead(true);

  const {
    data: folders,
    isLoading,
    isError,
    refetch,
  } = useRepositoryFolders();
  const { data: recentMaterials } = useRecentSummaries(5);
  const [sort, setSort] = useState<FolderSort>("recent");
  const [showEmptyFolders, setShowEmptyFolders] = useState(false);

  const visibleFolders = useMemo(() => {
    let list = folders ?? [];
    if (!showEmptyFolders) {
      list = list.filter((folder) => folder.documentCount > 0);
    }
    if (sort === "alpha") {
      list = [...list].sort((a, b) =>
        a.subject.localeCompare(b.subject, "fr"),
      );
    }
    return list;
  }, [folders, showEmptyFolders, sort]);

  const totalDocuments = (folders ?? []).reduce(
    (sum, folder) => sum + folder.documentCount,
    0,
  );
  const latestActivityAt = (folders ?? []).reduce<string | null>(
    (latest, folder) => {
      if (!folder.lastActivityAt) return latest;
      if (!latest) return folder.lastActivityAt;
      return new Date(folder.lastActivityAt) > new Date(latest)
        ? folder.lastActivityAt
        : latest;
    },
    null,
  );

  const hasAnyFolder = (folders?.length ?? 0) > 0;
  const hasVisibleFolders = visibleFolders.length > 0;
  const hasEmptyDocumentFolders = (folders ?? []).some(
    (folder) => folder.documentCount === 0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Mon répertoire</h2>
        <p className="mt-1 text-sm text-ink-600">
          Comptes-rendus et fiches déposés par vos professeurs, classés par
          matière
        </p>
        {totalDocuments > 0 && latestActivityAt ? (
          <p className="mt-2 text-sm text-ink-400">
            {totalDocuments} document{totalDocuments !== 1 ? "s" : ""} · dernier
            dépôt le {formatRepositoryDate(latestActivityAt)}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <RepositoryFoldersSkeleton />
      ) : isError ? (
        <div className="rounded-md border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          <p>Impossible de charger votre répertoire.</p>
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
          {recentMaterials && recentMaterials.length > 0 ? (
            <StudentRecentSummariesBanner materials={recentMaterials} />
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
            {hasEmptyDocumentFolders ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  className="rounded border-line"
                  checked={showEmptyFolders}
                  onChange={(e) => setShowEmptyFolders(e.target.checked)}
                />
                Afficher les matières vides
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
              Aucun document pour le moment.{" "}
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
