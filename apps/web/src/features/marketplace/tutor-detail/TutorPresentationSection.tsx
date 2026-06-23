import type { MarketplaceTutorBase } from "../marketplaceUtils";
import { TutorCollapsibleSection } from "./TutorCollapsibleSection";

interface TutorPresentationSectionProps {
  tutor: MarketplaceTutorBase;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

export function TutorPresentationSection({
  tutor,
  defaultOpen = true,
  collapsible = false,
}: TutorPresentationSectionProps) {
  const firstName = tutor.first_name.trim() || "ce professeur";
  const bio = tutor.bio ?? "Aucune description courte pour le moment.";
  const summary =
    bio.length > 80 ? `${bio.slice(0, 80).trim()}…` : bio;

  const content = (
    <p className="text-sm leading-relaxed text-ink-600">{bio}</p>
  );

  if (!collapsible) {
    return (
      <section className="rounded-md border border-line bg-surface p-6">
        <h2 className="font-semibold text-ink-900">Présentation</h2>
        <div className="mt-2">{content}</div>
      </section>
    );
  }

  return (
    <TutorCollapsibleSection
      title={`À propos de ${firstName}`}
      summary={summary}
      defaultOpen={defaultOpen}
    >
      {content}
    </TutorCollapsibleSection>
  );
}
