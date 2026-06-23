import { Button } from "@gadz-connect/ui";
import { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { campusDisplayName } from "@/features/campus/campusLabels";
import { useSelectedCampus } from "@/features/campus/useSelectedCampus";
import { usePageMeta } from "@/features/layout/usePageMeta";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import { TutorListFilters } from "@/features/marketplace/TutorListFilters";
import { TutorListShell } from "@/features/marketplace/TutorListShell";
import {
  collectSubjectOptions,
  countBookableTutors,
  filterTutors,
  sortTutorsByAvailability,
} from "@/features/marketplace/marketplaceUtils";
import { usePublicTutors } from "@/features/marketplace/usePublicTutors";
import { useTutorListFilters } from "@/features/marketplace/useTutorListFilters";

export function PublicTutorList({
  showFilters = true,
  limit,
}: {
  showFilters?: boolean;
  limit?: number;
}) {
  const { campusId, selectedCampus } = useSelectedCampus();
  const { data: tutors, isLoading, isError } = usePublicTutors(campusId);
  const { query, setQuery, subjectFilter, setSubjectFilter } =
    useTutorListFilters();

  useEffect(() => {
    if (campusId) {
      trackMarketplaceEvent("marketplace_view", { campusId });
    }
  }, [campusId]);

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

  const campusLabel = selectedCampus
    ? campusDisplayName(selectedCampus.name)
    : "votre campus";

  return (
    <div className="space-y-4">
      {tutors?.length ? (
        <p className="text-sm text-ink-600">
          {countBookableTutors(tutors)} prof
          {countBookableTutors(tutors) > 1 ? "s" : ""} avec créneaux ouverts
          sur {campusLabel}
          {tutors.length !== countBookableTutors(tutors)
            ? ` (${tutors.length} au total)`
            : ""}
        </p>
      ) : null}

      <TutorListShell
        tutors={filteredTutors}
        sourceCount={sortedTutors.length}
        isLoading={isLoading || !campusId}
        isError={isError}
        getDetailHref={(tutor) => marketplaceRoutes.detail(tutor.id, "public")}
        emptyMessage={`Aucun professeur disponible sur ${campusLabel} pour le moment. Les profs validés apparaissent ici automatiquement.`}
        emptyAction={
          <Button variant="outline" size="sm" asChild>
            <Link to={marketplaceRoutes.login("teacher")}>
              Vous êtes prof ? Rejoignez la plateforme
            </Link>
          </Button>
        }
        filters={
          showFilters ? (
            <TutorListFilters
              query={query}
              onQueryChange={setQuery}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
              subjectOptions={subjectOptions}
            />
          ) : undefined
        }
      />
    </div>
  );
}

export function PublicMarketplacePage() {
  usePageMeta(
    "Trouver un tuteur",
    "Parcourez les professeurs Arts et Métiers disponibles sur votre campus et réservez un cours particulier.",
  );

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Gadz&apos;Connect
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
          Trouvez un prof Arts et Métiers sur votre campus
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink-600">
          Cours particuliers, réservation en ligne. Parcourez les profils, comparez
          les matières et les tarifs — connectez-vous uniquement pour réserver.
        </p>
      </section>

      <PublicTutorList showFilters />

      <section className="rounded-md border border-line bg-surface p-6">
        <h2 className="font-semibold text-ink-900">Comment ça marche ?</h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-600">
          <li>
            <span className="font-medium text-ink-900">1.</span> Choisissez votre
            campus et parcourez les professeurs disponibles.
          </li>
          <li>
            <span className="font-medium text-ink-900">2.</span> Consultez la fiche
            prof : matières, tarif et créneaux ouverts.
          </li>
          <li>
            <span className="font-medium text-ink-900">3.</span> Connectez-vous
            avec votre mail Arts et Métiers pour réserver et payer en ligne.
          </li>
        </ol>
      </section>
    </div>
  );
}
