import { Button, cn, Input, Skeleton } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import { useOnboardingGuide } from "@/features/onboarding/guide/OnboardingGuideContext";
import {
  collectSubjectOptions,
  filterTutors,
  formatNextSlot,
  sortTutorsByAvailability,
} from "./marketplaceUtils";
import { useTutors } from "./useTutors";

function TutorAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 font-display text-sm font-semibold text-brand-700"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={className ?? "h-4 w-full"} />;
}

function TutorListSkeleton() {
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

interface TutorListProps {
  emptyMessage?: string;
  /** Nombre max de cartes affichées (aperçu cockpit). */
  limit?: number;
  /** Afficher recherche et filtres matières. */
  showFilters?: boolean;
  /** Empty state enrichi avec lien vers le guide. */
  showGuideEmptyState?: boolean;
}

export function TutorList({
  emptyMessage = "Aucun professeur disponible sur votre campus pour le moment. Les profs validés par la RH apparaissent ici automatiquement.",
  limit,
  showFilters = false,
  showGuideEmptyState = false,
}: TutorListProps) {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject")?.trim() || null;
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const { data: tutors, isLoading, isError } = useTutors();
  const { openGuideAt } = useOnboardingGuide();
  const [query, setQuery] = useState(initialQuery);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(
    initialSubject,
  );

  const sortedTutors = useMemo(
    () => sortTutorsByAvailability(tutors ?? []),
    [tutors],
  );

  const subjectOptions = useMemo(
    () => collectSubjectOptions(sortedTutors),
    [sortedTutors],
  );

  const filteredTutors = useMemo(() => {
    const filtered = filterTutors(sortedTutors, query, subjectFilter);
    return limit != null ? filtered.slice(0, limit) : filtered;
  }, [sortedTutors, query, subjectFilter, limit]);

  if (isLoading) {
    return <TutorListSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-danger" role="alert">
        Impossible de charger la liste des tuteurs.
      </p>
    );
  }

  if (!tutors?.length) {
    return (
      <div className="rounded-md border border-dashed border-line bg-paper p-6 text-center">
        <p className="text-sm text-ink-600">{emptyMessage}</p>
        {showGuideEmptyState ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-ink-400">
              Les professeurs apparaissent ici une fois validés par la RH, avec
              un tarif et des créneaux publiés.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openGuideAt("find_tutor")}
            >
              Ouvrir le guide
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="space-y-3 rounded-md border border-line bg-surface p-4">
          <Input
            type="search"
            placeholder="Rechercher par nom, matière ou description…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Rechercher un tuteur"
          />
          {subjectOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  subjectFilter === null
                    ? "bg-brand-600 text-white"
                    : "bg-paper text-ink-600 hover:bg-line",
                )}
                onClick={() => setSubjectFilter(null)}
              >
                Toutes les matières
              </button>
              {subjectOptions.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    subjectFilter === subject
                      ? "bg-brand-600 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100",
                  )}
                  onClick={() =>
                    setSubjectFilter(subjectFilter === subject ? null : subject)
                  }
                >
                  {subject}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {filteredTutors.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-600">
          Aucun tuteur ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTutors.map((tutor) => {
            const name = `${tutor.first_name} ${tutor.last_name}`.trim();
            const slotCount = tutor.available_slot_count ?? 0;
            const hasSlots = slotCount > 0;

            return (
              <Link
                key={tutor.id}
                to={`/app/cours/${tutor.id}`}
                className={cn(
                  "rounded-md border bg-surface p-5 transition hover:shadow-raised",
                  hasSlots
                    ? "border-line hover:border-brand-100"
                    : "border-line opacity-75 hover:border-line",
                )}
              >
                <div className="flex items-start gap-3">
                  <TutorAvatar name={name} />
                  <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-ink-900">{name}</p>
                  {tutor.cv || tutor.has_cv_pdf ? (
                    <span
                      className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success"
                      title="CV disponible"
                    >
                      CV
                    </span>
                  ) : null}
                </div>

                {tutor.bio ? (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-600">
                    {tutor.bio}
                  </p>
                ) : null}

                <p className="mt-2 text-sm font-medium text-ink-600">
                  {tutor.hourly_rate
                    ? `${formatEuro(tutor.hourly_rate)} / h`
                    : "Tarif à définir"}
                </p>

                {hasSlots ? (
                  <p className="mt-2 text-xs font-medium text-success">
                    {slotCount} créneau{slotCount > 1 ? "x" : ""} · Prochain :{" "}
                    {tutor.next_available_slot_at
                      ? formatNextSlot(tutor.next_available_slot_at)
                      : "—"}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-warning">
                    Aucun créneau ouvert — voir le profil
                  </p>
                )}

                {tutor.subjects.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tutor.subjects.slice(0, 4).map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                      >
                        {subject}
                      </span>
                    ))}
                    {tutor.subjects.length > 4 ? (
                      <span className="text-[11px] text-ink-400">
                        +{tutor.subjects.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
