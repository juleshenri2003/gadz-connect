import { Button } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { useMyCvPdfUrl } from "@/features/cv/useCvPdf";

interface TeacherProfileStudentPreviewProps {
  profile: MyProfile;
  bio: string | null | undefined;
  subjects: string[];
  hourlyRate: number | null | undefined;
}

export function TeacherProfileStudentPreview({
  profile,
  bio,
  subjects,
  hourlyRate,
}: TeacherProfileStudentPreviewProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const hasPdf = Boolean(profile.cv_pdf_path);
  const { data: pdfUrl } = useMyCvPdfUrl(hasPdf);
  const displayBio = bio ?? profile.bio;
  const displaySubjects = subjects.length > 0 ? subjects : profile.subjects;
  const displayRate = hourlyRate ?? profile.hourly_rate;

  return (
    <details className="group rounded-md border border-line bg-surface">
      <summary className="cursor-pointer px-6 py-4">
        <span className="font-semibold text-ink-900">Aperçu élève</span>
        <span className="ml-2 text-sm font-normal text-ink-400 group-open:hidden">
          — voir le rendu de votre fiche campus
        </span>
      </summary>
      <div className="space-y-6 border-t border-line px-6 pb-6 pt-4">
        <div>
          <p className="text-lg font-bold text-ink-900">{fullName}</p>
          <p className="mt-1 text-sm text-ink-600">
            {profile.campus?.name} —{" "}
            {displayRate ? `${formatEuro(displayRate)} / heure` : "Tarif non renseigné"}
          </p>
        </div>

        <section>
          <h3 className="font-semibold text-ink-900">Présentation</h3>
          <p className="mt-2 text-sm text-ink-600">
            {displayBio?.trim()
              ? displayBio
              : "Aucune description courte pour le moment."}
          </p>
          {displaySubjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {displaySubjects.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="font-semibold text-ink-900">CV</h3>
          <p className="mt-1 text-xs text-ink-400">
            Parcours et compétences — consultez avant de réserver
          </p>
          {hasPdf && pdfUrl ? (
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Ouvrir le CV PDF →
                </a>
              </Button>
            </div>
          ) : null}
          {profile.cv?.trim() ? (
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-600">
              {profile.cv}
            </pre>
          ) : !hasPdf ? (
            <p className="mt-4 text-sm text-warning">
              Ce professeur n&apos;a pas encore renseigné de CV.
            </p>
          ) : null}
        </section>
      </div>
    </details>
  );
}
