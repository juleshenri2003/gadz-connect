import { Button } from "@gadz-connect/ui";

interface TutorCvSectionProps {
  hasCvPdf: boolean;
  cvPdfUrl?: string | null;
  cvText?: string | null;
  /** Mode visiteur : pas d'accès au PDF. */
  guestMode?: boolean;
}

export function TutorCvSection({
  hasCvPdf,
  cvPdfUrl,
  cvText,
  guestMode = false,
}: TutorCvSectionProps) {
  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <h2 className="font-semibold text-ink-900">CV</h2>
      <p className="mt-1 text-xs text-ink-400">
        Parcours et compétences — consultez avant de réserver
      </p>
      {guestMode ? (
        <p className="mt-4 text-sm text-ink-600">
          {hasCvPdf || cvText
            ? "Connectez-vous pour consulter le CV complet de ce professeur."
            : "Ce professeur n'a pas encore renseigné de CV."}
        </p>
      ) : (
        <>
          {hasCvPdf && cvPdfUrl ? (
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href={cvPdfUrl} target="_blank" rel="noopener noreferrer">
                  Ouvrir le CV PDF →
                </a>
              </Button>
            </div>
          ) : null}
          {cvText ? (
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
              {cvText}
            </div>
          ) : !hasCvPdf ? (
            <p className="mt-4 text-sm text-warning">
              Ce professeur n&apos;a pas encore renseigné de CV.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
