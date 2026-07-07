import { Link } from "react-router-dom";
import type { SubjectFolder } from "@/features/repository/useRepository";
import { formatRepositoryDate } from "./studentRepositoryUtils";

interface StudentRepositoryFolderCardProps {
  folder: SubjectFolder;
}

function formatDocumentCount(folder: SubjectFolder): string {
  const parts: string[] = [];
  if (folder.summaryCount > 0) {
    parts.push(
      `${folder.summaryCount} compte-rendu${folder.summaryCount !== 1 ? "s" : ""}`,
    );
  }
  if (folder.clarificationCount > 0) {
    parts.push(
      `${folder.clarificationCount} fiche${folder.clarificationCount !== 1 ? "s" : ""}`,
    );
  }
  return parts.join(" · ");
}

export function StudentRepositoryFolderCard({
  folder,
}: StudentRepositoryFolderCardProps) {
  const isEmpty = folder.documentCount === 0;

  return (
    <Link
      to={`/app/repertoire/${folder.id}`}
      className={`rounded-md border bg-surface p-5 transition hover:shadow-surface ${
        isEmpty
          ? "border-line opacity-60 hover:border-line"
          : "border-line hover:border-brand-100"
      }`}
    >
      <p className="font-semibold text-ink-900">{folder.subject}</p>
      <p className="mt-1 text-sm text-ink-400">
        {isEmpty ? "Aucun document" : formatDocumentCount(folder)}
      </p>
      {folder.latestTitle && folder.lastActivityAt ? (
        <>
          <p className="mt-3 text-xs text-ink-600 line-clamp-2">
            Dernier : {folder.latestTitle}
            {folder.latestKind === "clarification" ? " (fiche)" : null}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {formatRepositoryDate(folder.lastActivityAt)}
          </p>
        </>
      ) : isEmpty ? (
        <p className="mt-3 text-xs text-ink-400">En attente de dépôt</p>
      ) : null}
    </Link>
  );
}
