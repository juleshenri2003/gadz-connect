import { Button, Input } from "@gadz-connect/ui";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { openEvaluationPdf } from "@/features/evaluations/useEvaluations";
import { RepositorySummariesSkeleton } from "@/features/repository/RepositoryPageSkeleton";
import { StudentRepositoryClarificationCard } from "@/features/repository/StudentRepositoryClarificationCard";
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

  const { getAccessToken } = useAuth();
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

  const filteredClarifications = useMemo(() => {
    const clarifications = data?.clarifications ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return clarifications;
    return clarifications.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.content ?? "").toLowerCase().includes(query),
    );
  }, [data?.clarifications, search]);

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

  async function handleOpenSummaryPdf(summaryId: string) {
    const token = getAccessToken();
    if (!token) return;
    await openEvaluationPdf(token, "summary", summaryId);
  }

  async function handleOpenClarificationPdf(clarificationId: string) {
    const token = getAccessToken();
    if (!token) return;
    await openEvaluationPdf(token, "clarification", clarificationId);
  }

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

  const totalItems =
    data.summaries.length + (data.clarifications?.length ?? 0);
  const hasItems = totalItems > 0;

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
          {data.summaries.length} compte-rendu
          {data.summaries.length !== 1 ? "s" : ""}
          {(data.clarifications?.length ?? 0) > 0
            ? ` · ${data.clarifications!.length} fiche${data.clarifications!.length !== 1 ? "s" : ""} complémentaire${data.clarifications!.length !== 1 ? "s" : ""}`
            : null}
        </p>
      </div>

      {hasItems ? (
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

      {!hasItems ? (
        <p className="text-sm text-ink-400">
          Aucun document dans ce dossier — vos professeurs déposeront ici leurs
          comptes-rendus et fiches.
        </p>
      ) : (
        <div className="space-y-8">
          {filteredSummaries.length > 0 ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Comptes-rendus
              </h3>
              {filteredSummaries.map((summary) => (
                <StudentRepositorySummaryCard
                  key={summary.id}
                  summary={summary}
                  highlighted={highlightedId === summary.id}
                  onOpenPdf={
                    summary.has_pdf ? handleOpenSummaryPdf : undefined
                  }
                />
              ))}
            </section>
          ) : null}

          {filteredClarifications.length > 0 ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Fiches complémentaires
              </h3>
              {filteredClarifications.map((clarification) => (
                <StudentRepositoryClarificationCard
                  key={clarification.id}
                  clarification={clarification}
                  onOpenPdf={
                    clarification.has_pdf
                      ? handleOpenClarificationPdf
                      : undefined
                  }
                />
              ))}
            </section>
          ) : null}

          {search.trim() &&
          filteredSummaries.length === 0 &&
          filteredClarifications.length === 0 ? (
            <p className="text-sm text-ink-400">
              Aucun document correspondant à votre recherche.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
