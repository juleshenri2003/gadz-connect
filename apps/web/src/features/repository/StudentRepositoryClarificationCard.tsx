import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import type { CourseClarification } from "@/features/repository/useRepository";
import {
  formatProviderName,
  formatRepositoryDate,
  getSessionDateIso,
  truncateContent,
} from "./studentRepositoryUtils";

interface StudentRepositoryClarificationCardProps {
  clarification: CourseClarification;
  onOpenPdf?: (id: string) => void;
}

export function StudentRepositoryClarificationCard({
  clarification,
  onOpenPdf,
}: StudentRepositoryClarificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const provider = formatProviderName(clarification.provider);
  const sessionIso = getSessionDateIso({ course: clarification.course });
  const content = clarification.content ?? "";
  const { text: previewText, truncated } = truncateContent(content);
  const showFull = expanded || !truncated;

  return (
    <article className="rounded-md border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-ink-900">{clarification.title}</h3>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          Fiche complémentaire
        </span>
      </div>

      <p className="mt-2 text-xs text-ink-400">
        {sessionIso ? <>Séance du {formatRepositoryDate(sessionIso)} · </> : null}
        Déposée le {formatRepositoryDate(clarification.created_at)}
        {" · "}
        <span className="text-brand-600">Par {provider}</span>
      </p>

      {content ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-ink-600">
          {showFull ? content : previewText}
        </p>
      ) : null}

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

      {clarification.has_pdf && onOpenPdf ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => onOpenPdf(clarification.id)}
        >
          Ouvrir le PDF
        </Button>
      ) : null}
    </article>
  );
}
