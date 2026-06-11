import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useFolderSummaries,
  useRepositoryFolders,
} from "@/features/repository/useRepository";

export function StudentRepositoryPage() {
  const { data: profile } = useMyProfile();
  if (profile && !isStudent(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  const { data: folders, isLoading, isError } = useRepositoryFolders();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mon répertoire</h2>
        <p className="mt-1 text-sm text-slate-600">
          Résumés de cours déposés par vos professeurs, classés par matière
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Impossible de charger le répertoire.</p>
      ) : !folders?.length ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Aucun dossier pour le moment. Les résumés apparaîtront ici après vos
          cours.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/app/repertoire/${folder.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <p className="font-semibold text-slate-900">{folder.subject}</p>
              <p className="mt-1 text-sm text-slate-500">
                {folder.summaryCount} résumé{folder.summaryCount !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" asChild>
        <Link to="/app">← Tableau de bord</Link>
      </Button>
    </div>
  );
}

export function StudentRepositoryFolderPage() {
  const { data: profile } = useMyProfile();
  if (profile && !isStudent(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  const { folderId } = useParams<{ folderId: string }>();
  const { data, isLoading, isError } = useFolderSummaries(folderId ?? null);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger ce dossier.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/repertoire">← Toutes les matières</Link>
        </Button>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          {data.folder.subject}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Notions importantes de vos sessions de tutorat
        </p>
      </div>

      {!data.summaries.length ? (
        <p className="text-sm text-slate-500">Aucun résumé dans ce dossier.</p>
      ) : (
        <div className="space-y-4">
          {data.summaries.map((summary) => {
            const provider = summary.provider
              ? `${summary.provider.first_name} ${summary.provider.last_name}`.trim()
              : "Professeur";
            return (
              <article
                key={summary.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {summary.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {new Date(summary.published_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="mt-1 text-xs text-indigo-600">Par {provider}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {summary.content}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
