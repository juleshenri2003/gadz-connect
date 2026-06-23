import { Button, cn } from "@gadz-connect/ui";
import { ArrowRight } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthModal } from "@/features/auth/authModalContext";
import { campusDisplayName } from "@/features/campus/campusLabels";
import { usePublicCampusRoute } from "@/features/campus/usePublicCampusRoute";
import { usePageMeta } from "@/features/layout/usePageMeta";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import { TutorListFilters } from "@/features/marketplace/TutorListFilters";
import { TutorListShell } from "@/features/marketplace/TutorListShell";
import {
  collectSubjectOptions,
  collectTopSubjects,
  countBookableTutors,
  filterBookableTutors,
  filterTutors,
  sortTutorsByAvailability,
} from "@/features/marketplace/marketplaceUtils";
import {
  usePublicCampusStats,
  usePublicTutors,
} from "@/features/marketplace/usePublicTutors";
import { useTutorListFilters } from "@/features/marketplace/useTutorListFilters";

export function PublicTutorList({
  showFilters = true,
  limit,
  showCounter = false,
  filterVariant = "default",
}: {
  showFilters?: boolean;
  limit?: number;
  showCounter?: boolean;
  filterVariant?: "default" | "compact";
}) {
  const { campusId, selectedCampus } = usePublicCampusRoute();
  const [bookableOnly, setBookableOnly] = useState(true);
  const { data: tutors, isLoading, isError, refetch } = usePublicTutors(campusId);
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

  const topSubjects = useMemo(
    () => collectTopSubjects(sortedTutors, 3),
    [sortedTutors],
  );

  const filteredTutors = useMemo(() => {
    let result = filterTutors(sortedTutors, query, subjectFilter);
    if (bookableOnly) {
      result = filterBookableTutors(result);
    }
    return limit != null ? result.slice(0, limit) : result;
  }, [sortedTutors, query, subjectFilter, bookableOnly, limit]);

  const sourceCount = useMemo(() => {
    let base = sortedTutors;
    if (bookableOnly) base = filterBookableTutors(base);
    return base.length;
  }, [sortedTutors, bookableOnly]);

  const campusLabel = selectedCampus
    ? campusDisplayName(selectedCampus.name)
    : "votre campus";

  return (
    <div className="space-y-4">
      {showCounter && tutors?.length ? (
        <p className="text-sm text-ink-500">
          {countBookableTutors(tutors)} prof
          {countBookableTutors(tutors) > 1 ? "s" : ""} avec créneaux ouverts
          {tutors.length !== countBookableTutors(tutors)
            ? ` · ${tutors.length} au total`
            : ""}
        </p>
      ) : null}

      <TutorListShell
        tutors={filteredTutors}
        sourceCount={sourceCount}
        isLoading={isLoading || !campusId}
        isError={isError}
        onRetry={() => void refetch()}
        getDetailHref={(tutor) => marketplaceRoutes.detail(tutor.id, "public")}
        onCardClick={(tutor) =>
          trackMarketplaceEvent("tutor_card_click", { tutorId: tutor.id })
        }
        emptyMessage={`Aucun professeur disponible sur ${campusLabel} pour le moment. Les profs validés apparaissent ici automatiquement.`}
        noMatchMessage={
          bookableOnly
            ? "Aucun prof avec créneaux ouverts ne correspond à votre recherche."
            : "Aucun tuteur ne correspond à votre recherche."
        }
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
              variant={filterVariant}
              query={query}
              onQueryChange={setQuery}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
              subjectOptions={subjectOptions}
              topSubjects={topSubjects}
              bookableOnly={bookableOnly}
              onBookableOnlyChange={setBookableOnly}
              onFilterApply={(filter) =>
                trackMarketplaceEvent("filter_apply", { filter })
              }
            />
          ) : undefined
        }
      />
    </div>
  );
}

export function PublicMarketplacePage() {
  const { campusId, selectedCampus, canonicalUrl } = usePublicCampusRoute();
  const { openAuthModal } = useAuthModal();
  const { data: stats } = usePublicCampusStats(campusId);
  const { data: tutors } = usePublicTutors(campusId);

  const campusLabel = selectedCampus
    ? campusDisplayName(selectedCampus.name)
    : "votre campus";

  const bookableCount =
    stats?.bookable_count ?? (tutors ? countBookableTutors(tutors) : null);

  usePageMeta(
    `Tuteurs ${campusLabel}`,
    `Parcourez les professeurs Arts et Métiers disponibles sur le campus ${campusLabel} et réservez un cours particulier.`,
    { url: canonicalUrl },
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">
            Professeurs disponibles sur {campusLabel}
          </h1>
          {bookableCount != null ? (
            <p className="text-sm text-ink-600">
              {bookableCount} prof{bookableCount > 1 ? "s" : ""} avec créneaux
              ouverts · connectez-vous uniquement pour réserver
            </p>
          ) : (
            <p className="text-sm text-ink-600">
              Cours particuliers sur votre campus — connectez-vous uniquement
              pour réserver
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            trackMarketplaceEvent("hero_cta_click", {
              action: "teacher_signup",
            });
            openAuthModal({ mode: "signup", role: "teacher" });
          }}
          className={cn(
            "group ml-auto inline-flex shrink-0 items-center gap-1.5 self-start rounded-full",
            "border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 transition",
            "hover:border-brand-300 hover:bg-brand-100",
          )}
        >
          Je suis prof
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
      </section>

      <section id="tutor-list" className="scroll-mt-24">
        <PublicTutorList showFilters filterVariant="compact" />
      </section>
    </div>
  );
}
