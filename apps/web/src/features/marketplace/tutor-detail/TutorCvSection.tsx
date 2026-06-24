import { Button } from "@gadz-connect/ui";
import { TutorCollapsibleSection } from "./TutorCollapsibleSection";

interface TutorCvSectionProps {
  hasCvPdf: boolean;
  cvPdfUrl?: string | null;
  cvText?: string | null;
  /** Mode visiteur : pas d'accès au PDF. */
  guestMode?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  embedded?: boolean;
}

export function TutorCvSection({
  hasCvPdf,
  cvPdfUrl,
  cvText,
  guestMode = false,
  defaultOpen = false,
  collapsible = false,
  embedded = false,
}: TutorCvSectionProps) {
  const hasCv = hasCvPdf || Boolean(cvText?.trim());

  if (guestMode && !hasCv) {
    return null;
  }

  if (!guestMode && !hasCv) {
    return null;
  }

  const guestSummary = hasCv
    ? "CV disponible — connexion requise"
    : "CV non renseigné";

  const content = guestMode ? (
    <p className="text-sm text-ink-600">
      {hasCv
        ? "Connectez-vous pour consulter le CV complet de ce professeur."
        : "Ce professeur n'a pas encore renseigné de CV."}
    </p>
  ) : (
    <>
      {hasCvPdf && cvPdfUrl ? (
        <div>
          <Button variant="outline" size="sm" asChild>
            <a href={cvPdfUrl} target="_blank" rel="noopener noreferrer">
              Ouvrir le CV PDF →
            </a>
          </Button>
        </div>
      ) : null}
      {cvText ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
          {cvText}
        </div>
      ) : !hasCvPdf ? (
        <p className="text-sm text-warning">
          Ce professeur n&apos;a pas encore renseigné de CV.
        </p>
      ) : null}
    </>
  );

  if (!collapsible) {
    return (
      <section className="rounded-md border border-line bg-surface p-6">
        <h2 className="font-semibold text-ink-900">CV</h2>
        <p className="mt-1 text-xs text-ink-400">
          Parcours et compétences — consultez avant de réserver
        </p>
        <div className="mt-4">{content}</div>
      </section>
    );
  }

  return (
    <TutorCollapsibleSection
      title="CV"
      summary={guestMode ? guestSummary : hasCv ? "Parcours et compétences" : guestSummary}
      defaultOpen={defaultOpen}
      embedded={embedded}
    >
      {content}
    </TutorCollapsibleSection>
  );
}
