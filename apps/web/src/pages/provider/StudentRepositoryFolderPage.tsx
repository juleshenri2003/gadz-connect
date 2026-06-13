import { Button, Input } from "@gadz-connect/ui";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { RepositorySummariesSkeleton } from "@/features/repository/RepositoryPageSkeleton";
import { StudentRepositorySummaryCard } from "@/features/repository/StudentRepositorySummaryCard";
import { useFolderSummaries } from "@/features/repository/useRepository";

function parseSummaryHash(hash: string): string | null {
  const match = hash.match(/^#summary-(.+)$/);
  return match?.[1] ?? null;
}

export function StudentRepositoryFolderPage() {
  const { data: profile } = useMyProfile();
  if (profile && !isStudent(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  const { folderId } = useParams<{ folderId: string }>();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useFolderSummaries(folderId ?? null);
  const [search, setSearch] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filteredSummaries = useMemo(() => {
    const summaries = data?.summaries ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return summaries;
    return summaries.filter(
      (summary) =>
        summary.title.toLowerCase().includes(query) ||
        summary.content.toLowerCase().includes(query),
    );
  }, [data?.summaries, search]);

  useEffect(() => {
    const hash = window.location.hash;
    const summaryId = parseSummaryHash(hash);
    if (!summaryId || !data?.summaries.length) return;

    setHighlightedId(summaryId);
    const el = document.getElementById(`summary-${summaryId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const timer = window.setTimeout(() => setHighlightedId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [data?.summaries]);

  if (isLoading) {
    return <RepositorySummariesSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
        <p>Impossible de charger ce dossier.</p>
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/repertoire">← Toutes les matières</Link>
        </Button>
        <h2 className="mt-4 text-2xl font-bold text-ink-900">
          {data.folder.subject}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {data.summaries.length} résumé
          {data.summaries.length !== 1 ? "s" : ""} · notions importantes de vos
          sessions de tutorat
        </p>
      </div>

      {data.summaries.length > 0 ? (
        <div className="max-w-md">
          <Input
            type="search"
            placeholder="Rechercher dans ce dossier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher dans ce dossier"
          />
        </div>
      ) : null}

      {!data.summaries.length ? (
        <p className="text-sm text-ink-400">Aucun résumé dans ce dossier.</p>
      ) : filteredSummaries.length === 0 ? (
        <p className="text-sm text-ink-400">
          Aucun résumé correspondant à votre recherche.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((summary) => (
            <StudentRepositorySummaryCard
              key={summary.id}
              summary={summary}
              highlighted={highlightedId === summary.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
