import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { CourseSummary } from "@/features/repository/useRepository";
import {
  formatProviderName,
  formatRepositoryDate,
  getSessionDateIso,
  planningWeekLink,
  truncateContent,
} from "./studentRepositoryUtils";

interface StudentRepositorySummaryCardProps {
  summary: CourseSummary;
  highlighted?: boolean;
  onOpenPdf?: (id: string) => void;
}

export function StudentRepositorySummaryCard({
  summary,
  highlighted = false,
  onOpenPdf,
}: StudentRepositorySummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const provider = formatProviderName(summary.provider);
  const sessionIso = getSessionDateIso(summary);
  const { text: previewText, truncated } = truncateContent(summary.content);
  const showFull = expanded || !truncated;

  return (
    <article
      id={`summary-${summary.id}`}
      className={`rounded-md border bg-surface p-6 transition ${
        highlighted
          ? "border-brand-100 ring-2 ring-brand-100"
          : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-ink-900">{summary.title}</h3>
      </div>

      <p className="mt-2 text-xs text-ink-400">
        {sessionIso ? (
          <>
            Séance du {formatRepositoryDate(sessionIso)}
            {" · "}
          </>
        ) : null}
        Publié le {formatRepositoryDate(summary.published_at)}
        {" · "}
        <span className="text-brand-600">Par {provider}</span>
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-600">
        {showFull ? summary.content : previewText}
      </p>

      {truncated && !expanded ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto p-0 text-brand-700"
          onClick={() => setExpanded(true)}
        >
          Lire la suite
        </Button>
      ) : null}

      {summary.has_pdf && onOpenPdf ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => onOpenPdf(summary.id)}
        >
          Ouvrir le PDF
        </Button>
      ) : null}

      {sessionIso ? (
        <p className="mt-4">
          <Link
            to={planningWeekLink(sessionIso)}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Voir dans l&apos;emploi du temps →
          </Link>
        </p>
      ) : null}
    </article>
  );
}
