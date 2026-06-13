import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { TutorList } from "@/features/marketplace/TutorList";

interface StudentTutorsPanelProps {
  tutorCount: number;
}

export function StudentTutorsPanel({ tutorCount }: StudentTutorsPanelProps) {
  return (
    <section
      id="trouver-un-tuteur"
      className="scroll-mt-6 space-y-4 rounded-md border border-line bg-surface p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Trouver mon tuteur</h3>
          <p className="mt-1 text-sm text-ink-600">
            Professeurs inscrits et validés sur votre campus (Stripe + tarif
            configurés).
          </p>
        </div>
        {tutorCount > 0 ? (
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/cours">Voir tout →</Link>
          </Button>
        ) : null}
      </div>
      <TutorList limit={3} />
    </section>
  );
}
