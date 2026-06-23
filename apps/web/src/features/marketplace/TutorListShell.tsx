import { Button, Skeleton } from "@gadz-connect/ui";
import type { MarketplaceTutorBase } from "./marketplaceUtils";
import { TutorCard } from "./TutorCard";

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={className ?? "h-4 w-full"} />;
}

export function TutorListSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Chargement des tuteurs"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-md border border-line bg-surface p-5"
        >
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="mt-3 h-3 w-24" />
          <SkeletonLine className="mt-4 h-10 w-full" />
          <SkeletonLine className="mt-3 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

interface TutorListShellProps<T extends MarketplaceTutorBase> {
  tutors: T[];
  getDetailHref: (tutor: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  noMatchMessage?: string;
  /** Nombre de tuteurs avant filtrage (pour distinguer empty vs no match). */
  sourceCount?: number;
  filters?: React.ReactNode;
  onCardClick?: (tutor: T, event: React.MouseEvent) => void;
  renderCard?: (tutor: T, href: string) => React.ReactNode;
  onRetry?: () => void;
}

export function TutorListShell<T extends MarketplaceTutorBase>({
  tutors,
  getDetailHref,
  isLoading,
  isError,
  emptyMessage = "Aucun professeur disponible sur votre campus pour le moment.",
  emptyAction,
  noMatchMessage = "Aucun tuteur ne correspond à votre recherche.",
  sourceCount,
  filters,
  onCardClick,
  renderCard,
  onRetry,
}: TutorListShellProps<T>) {
  if (isLoading) return <TutorListSkeleton />;

  if (isError) {
    return (
      <div className="rounded-md border border-danger/20 bg-danger-bg/30 p-4 text-center">
        <p className="text-sm text-danger" role="alert">
          Impossible de charger la liste des tuteurs.
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            Réessayer
          </Button>
        ) : null}
      </div>
    );
  }

  const unfilteredCount = sourceCount ?? tutors.length;

  if (!unfilteredCount) {
    return (
      <div className="rounded-md border border-dashed border-line bg-paper p-6 text-center">
        <p className="text-sm text-ink-600">{emptyMessage}</p>
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filters}
      {!tutors.length ? (
        <p className="rounded-md border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-600">
          {noMatchMessage}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tutors.map((tutor) => {
            const href = getDetailHref(tutor);
            if (renderCard) return renderCard(tutor, href);
            return (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                to={href}
                onClick={
                  onCardClick
                    ? (event) => onCardClick(tutor, event)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
