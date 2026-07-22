import { cn } from "@gadz-connect/ui";
import type { AdminCourseRow } from "@/features/admin/types";
import { COURSE_VISUAL_META } from "@/features/scheduling/calendar-utils";
import { CourseStatusBadge } from "./CourseStatusBadge";
import { groupCoursesByVisualCategory } from "./courseDirectoryGroups";
import {
  courseDisplayTitle,
  formatCourseSessionWhen,
} from "./courseUtils";
import { CoursesTableSkeleton } from "./CoursesTableSkeleton";
import { getEmptyStateMessage, type CourseFiltersState } from "./courseFilters";

interface CoursesTableProps {
  courses: AdminCourseRow[];
  filters: CourseFiltersState;
  showCampus: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onOpenCourse: (courseId: string) => void;
  onRetry?: () => void;
}

function CourseRowMobile({
  course,
  showCampus,
  onOpen,
}: {
  course: AdminCourseRow;
  showCampus: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full flex-col gap-2 p-4 text-left active:bg-paper"
        onClick={onOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-ink-900">
              {courseDisplayTitle(course)}
            </p>
            <p className="text-sm text-ink-600">
              {formatCourseSessionWhen(course.starts_at, course.ends_at)}
            </p>
          </div>
          <CourseStatusBadge
            status={course.status}
            startsAt={course.starts_at}
            endsAt={course.ends_at}
          />
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-ink-600">
          <span>Prof : {course.provider_name ?? "—"}</span>
          <span aria-hidden>·</span>
          <span>Élève : {course.client_name ?? "—"}</span>
          {showCampus && course.campus?.name ? (
            <>
              <span aria-hidden>·</span>
              <span>{course.campus.name}</span>
            </>
          ) : null}
        </div>
        {course.missing_summary ? (
          <span className="w-fit rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            CR manquant
          </span>
        ) : null}
      </button>
    </li>
  );
}

function CourseRowDesktop({
  course,
  showCampus,
  onOpen,
}: {
  course: AdminCourseRow;
  showCampus: boolean;
  onOpen: () => void;
}) {
  return (
    <tr
      className="cursor-pointer border-b last:border-0 hover:bg-paper"
      onClick={onOpen}
    >
      <td className="whitespace-nowrap px-4 py-3 text-ink-600">
        {formatCourseSessionWhen(course.starts_at, course.ends_at)}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-ink-900">{courseDisplayTitle(course)}</p>
        {course.subject && course.title !== course.subject ? (
          <p className="text-xs text-ink-400">{course.title}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-ink-600">
        {course.provider_name ?? "—"}
      </td>
      <td className="px-4 py-3 text-ink-600">{course.client_name ?? "—"}</td>
      {showCampus ? (
        <td className="px-4 py-3 text-ink-600">
          {course.campus?.name ?? "—"}
        </td>
      ) : null}
      <td className="px-4 py-3">
        <CourseStatusBadge
          status={course.status}
          startsAt={course.starts_at}
          endsAt={course.ends_at}
        />
      </td>
      <td className="px-4 py-3">
        {course.missing_summary ? (
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            CR manquant
          </span>
        ) : null}
      </td>
    </tr>
  );
}

export function CoursesTable({
  courses,
  filters,
  showCampus,
  isLoading,
  isError,
  errorMessage,
  onOpenCourse,
  onRetry,
}: CoursesTableProps) {
  if (isLoading) {
    return <CoursesTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-md border border-line bg-surface p-4">
        <p className="text-sm text-danger">
          {errorMessage ?? "Impossible de charger les cours."}
        </p>
        {onRetry ? (
          <button
            type="button"
            className="text-sm font-medium text-brand-700 underline"
            onClick={onRetry}
          >
            Réessayer
          </button>
        ) : null}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface p-4">
        <p className="text-sm text-ink-400">{getEmptyStateMessage(filters)}</p>
      </div>
    );
  }

  const groups = groupCoursesByVisualCategory(courses);

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const meta = COURSE_VISUAL_META[group.id];
        return (
          <section
            key={group.id}
            className={cn(
              "overflow-hidden rounded-md border border-line border-l-4 bg-surface",
              group.id === "pending" && "border-l-brand-500",
              group.id === "awaiting_data" && "border-l-warning",
              group.id === "completed" && "border-l-success",
              group.id === "replaced" && "border-l-violet-500",
              group.id === "cancelled" && "border-l-orange-500",
              group.id === "other" && "border-l-ink-300",
            )}
          >
            <header
              className={cn(
                "flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3",
                meta.swatch,
              )}
            >
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  {group.label}
                </h3>
                <p className="mt-0.5 text-xs text-ink-600">{group.hint}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                  meta.classes,
                )}
              >
                {group.courses.length}
              </span>
            </header>

            <ul className="divide-y divide-line lg:hidden">
              {group.courses.map((course) => (
                <CourseRowMobile
                  key={course.id}
                  course={course}
                  showCampus={showCampus}
                  onOpen={() => onOpenCourse(course.id)}
                />
              ))}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b bg-paper/60 text-ink-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">Session</th>
                    <th className="px-4 py-2 font-medium">Titre / matière</th>
                    <th className="px-4 py-2 font-medium">Professeur</th>
                    <th className="px-4 py-2 font-medium">Élève</th>
                    {showCampus ? (
                      <th className="px-4 py-2 font-medium">Campus</th>
                    ) : null}
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 font-medium">Indicateurs</th>
                  </tr>
                </thead>
                <tbody>
                  {group.courses.map((course) => (
                    <CourseRowDesktop
                      key={course.id}
                      course={course}
                      showCampus={showCampus}
                      onOpen={() => onOpenCourse(course.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
