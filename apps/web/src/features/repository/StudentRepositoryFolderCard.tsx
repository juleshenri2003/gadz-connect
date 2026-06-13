import { Link } from "react-router-dom";
import type { SubjectFolder } from "@/features/repository/useRepository";
import { formatRepositoryDate } from "./studentRepositoryUtils";

interface StudentRepositoryFolderCardProps {
  folder: SubjectFolder;
}

export function StudentRepositoryFolderCard({
  folder,
}: StudentRepositoryFolderCardProps) {
  const isEmpty = folder.summaryCount === 0;

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
        {folder.summaryCount} résumé{folder.summaryCount !== 1 ? "s" : ""}
      </p>
      {folder.latestTitle && folder.lastSummaryAt ? (
        <p className="mt-3 text-xs text-ink-600 line-clamp-2">
          Dernier : {folder.latestTitle}
        </p>
      ) : null}
      {folder.lastSummaryAt ? (
        <p className="mt-1 text-xs text-ink-400">
          {formatRepositoryDate(folder.lastSummaryAt)}
        </p>
      ) : isEmpty ? (
        <p className="mt-3 text-xs text-ink-400">Aucun résumé</p>
      ) : null}
    </Link>
  );
}
