import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import { useTutors } from "./useTutors";

interface TutorListProps {
  emptyMessage?: string;
}

export function TutorList({
  emptyMessage = "Aucun professeur disponible sur votre campus pour le moment. Les profs validés par la RH apparaissent ici automatiquement.",
}: TutorListProps) {
  const { data: tutors, isLoading, isError } = useTutors();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement des tuteurs…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        Impossible de charger la liste des tuteurs.
      </p>
    );
  }

  if (!tutors?.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tutors.map((tutor) => {
        const name = `${tutor.first_name} ${tutor.last_name}`.trim();
        return (
          <Link
            key={tutor.id}
            to={`/app/cours/${tutor.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-indigo-600">
              Professeur
            </p>
            {tutor.bio ? (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {tutor.bio}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-slate-500">
              {tutor.hourly_rate
                ? `${formatEuro(tutor.hourly_rate)} / h`
                : "Tarif à définir"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tutor.cv || tutor.has_cv_pdf ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  CV disponible{tutor.has_cv_pdf ? " (PDF)" : ""}
                </span>
              ) : null}
              {tutor.subjects.length > 0 ? (
                <span className="text-xs text-indigo-600">
                  {tutor.subjects.slice(0, 3).join(" · ")}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
