import type { MarketplaceTutorBase } from "../marketplaceUtils";

interface TutorPresentationSectionProps {
  tutor: MarketplaceTutorBase;
}

export function TutorPresentationSection({
  tutor,
}: TutorPresentationSectionProps) {
  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <h2 className="font-semibold text-ink-900">Présentation</h2>
      <p className="mt-2 text-sm text-ink-600">
        {tutor.bio ?? "Aucune description courte pour le moment."}
      </p>
      {tutor.subjects.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tutor.subjects.map((subject) => (
            <span
              key={subject}
              className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {subject}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
