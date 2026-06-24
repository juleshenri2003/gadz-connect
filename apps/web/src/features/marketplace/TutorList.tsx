import { Button } from "@gadz-connect/ui";
import { useMemo } from "react";
import { useOnboardingGuide } from "@/features/onboarding/guide/OnboardingGuideContext";
import { marketplaceRoutes } from "./marketplaceRoutes";
import { TutorListFilters } from "./TutorListFilters";
import { TutorListShell } from "./TutorListShell";
import {
  collectSubjectOptions,
  filterTutors,
  sortTutorsByAvailability,
} from "./marketplaceUtils";
import { useTutorListFilters } from "./useTutorListFilters";
import { useTutors } from "./useTutors";

interface TutorListProps {
  emptyMessage?: string;
  limit?: number;
  showFilters?: boolean;
  showGuideEmptyState?: boolean;
}

export function TutorList({
  emptyMessage = "Aucun professeur disponible sur votre campus pour le moment. Les profs validés par la RH apparaissent ici automatiquement.",
  limit,
  showFilters = false,
  showGuideEmptyState = false,
}: TutorListProps) {
  const { data: tutors, isLoading, isError } = useTutors();
  const { openGuideAt } = useOnboardingGuide();
  const { query, setQuery, subjectFilter, setSubjectFilter } =
    useTutorListFilters();

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

  const displayTutors =
    showFilters || limit != null ? filteredTutors : sortedTutors;

  return (
    <TutorListShell
      tutors={displayTutors}
      sourceCount={sortedTutors.length}
      isLoading={isLoading}
      isError={isError}
      getDetailHref={(tutor) => marketplaceRoutes.detail(tutor.id, "app")}
      emptyMessage={emptyMessage}
      noMatchMessage="Aucun tuteur ne correspond à votre recherche."
      emptyAction={
        showGuideEmptyState ? (
          <div className="space-y-3">
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
        ) : undefined
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
  );
}
