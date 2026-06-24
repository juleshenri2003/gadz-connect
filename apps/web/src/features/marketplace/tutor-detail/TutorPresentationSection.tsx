import { cn } from "@gadz-connect/ui";
import type { MarketplaceTutorBase } from "../marketplaceUtils";
import { TutorCollapsibleSection } from "./TutorCollapsibleSection";

interface TutorPresentationSectionProps {
  tutor: MarketplaceTutorBase;
  defaultOpen?: boolean;
  collapsible?: boolean;
  embedded?: boolean;
  /** Bio visible dans le hero ; accordéon seulement si texte long. */
  heroInline?: boolean;
}

const BIO_INLINE_THRESHOLD = 200;

export function TutorPresentationSection({
  tutor,
  defaultOpen = true,
  collapsible = false,
  embedded = false,
  heroInline = false,
}: TutorPresentationSectionProps) {
  const firstName = tutor.first_name.trim() || "ce professeur";
  const bio = tutor.bio?.trim() || "Aucune description courte pour le moment.";
  const summary =
    bio.length > 80 ? `${bio.slice(0, 80).trim()}…` : bio;
  const isLongBio = bio.length > BIO_INLINE_THRESHOLD;

  const content = (
    <p className="text-sm leading-relaxed text-ink-600">{bio}</p>
  );

  if (heroInline) {
    if (isLongBio) {
      return (
        <TutorCollapsibleSection
          title="Présentation"
          summary={`${bio.slice(0, BIO_INLINE_THRESHOLD).trimEnd()}…`}
          defaultOpen={defaultOpen}
          embedded={embedded}
        >
          {content}
        </TutorCollapsibleSection>
      );
    }

    return (
      <div
        className={cn(
          "border-t border-brand-100 px-4 py-4 sm:px-6",
          embedded ? "bg-surface" : "",
        )}
      >
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-600">{bio}</p>
      </div>
    );
  }

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
      embedded={embedded}
    >
      {content}
    </TutorCollapsibleSection>
  );
}
