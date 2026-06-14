import { Button } from "@gadz-connect/ui";
import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildAdminPlanningHref } from "@/features/scheduling/adminScheduleUtils";
import {
  useAdminCampuses,
  useAdminCourses,
  useAdminCoursesSummary,
  useAdminMe,
} from "@/features/admin/useAdmin";
import { CourseDetailDrawer } from "@/features/admin/courses/CourseDetailDrawer";
import { CoursesFilterBar } from "@/features/admin/courses/CoursesFilterBar";
import { CoursesKpiStrip } from "@/features/admin/courses/CoursesKpiStrip";
import { CoursesTable } from "@/features/admin/courses/CoursesTable";
import { CoursesPageSkeleton } from "@/features/admin/courses/CoursesTableSkeleton";
import {
  filtersFromSearchParams,
  filtersToApiParams,
  filtersToQueryParams,
  type CourseFiltersState,
} from "@/features/admin/courses/courseFilters";
import type { AdminCoursePreset } from "@/features/admin/types";

const PAGE_SIZE = 50;

export function AdminCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const { data: me } = useAdminMe();
  const { data: campuses = [] } = useAdminCampuses();
  const isGlobalScope = me?.role === "admin_general";
  const campusIdForSummary =
    filters.campusId !== "all" ? filters.campusId : undefined;

  const apiParams = useMemo(
    () => filtersToApiParams(filters, page, PAGE_SIZE),
    [filters, page],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminCourses(apiParams);
  const summaryQuery = useAdminCoursesSummary(campusIdForSummary);

  const courses = data?.courses ?? [];
  const meta = data?.meta;
  const selectedListCourse =
    courses.find((course) => course.id === selectedCourseId) ?? null;

  const updateFilters = useCallback(
    (next: CourseFiltersState) => {
      setPage(1);
      setSearchParams(filtersToQueryParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handlePresetChange = useCallback(
    (preset: AdminCoursePreset | null) => {
      updateFilters({ ...filters, preset, statuses: [] });
    },
    [filters, updateFilters],
  );

  const scopeLabel = isGlobalScope
    ? "Tous les campus Arts et Métiers"
    : "Périmètre limité à votre campus";

  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.pageSize))
    : 1;

  const showInitialSkeleton =
    isLoading && !data && summaryQuery.isLoading && !summaryQuery.data;

  if (showInitialSkeleton) {
    return <CoursesPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Cours</h2>
          <p className="mt-1 text-sm text-ink-600">
            Registre des sessions de tutorat — supervision et recherche
          </p>
          <p className="mt-1 text-xs text-ink-400">{scopeLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={buildAdminPlanningHref({})}>
              Emploi du temps →
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/admin">← Retour au pilotage</Link>
          </Button>
        </div>
      </div>

      <CoursesKpiStrip
        summary={summaryQuery.data}
        loading={summaryQuery.isLoading}
        activePreset={filters.preset}
        onPresetChange={handlePresetChange}
      />

      <CoursesFilterBar
        filters={filters}
        campuses={campuses}
        showCampusFilter={isGlobalScope}
        onChange={updateFilters}
        onReset={resetFilters}
        displayedCount={courses.length}
        totalCount={meta?.total ?? 0}
      />

      <CoursesTable
        courses={courses}
        filters={filters}
        showCampus={isGlobalScope}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        onOpenCourse={setSelectedCourseId}
        onRetry={() => void refetch()}
      />

      {meta && meta.total > meta.pageSize ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-ink-600">
            Page {meta.page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      <CourseDetailDrawer
        courseId={selectedCourseId}
        listCourse={selectedListCourse}
        onClose={() => setSelectedCourseId(null)}
      />
    </div>
  );
}
