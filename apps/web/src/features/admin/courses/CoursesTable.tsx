import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import type { AdminCourseRow } from "@/features/admin/types";
import { CourseStatusBadge } from "./CourseStatusBadge";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registre des sessions</CardTitle>
        <CardDescription className="hidden lg:block">
          Cliquez sur une ligne pour ouvrir la fiche détail
        </CardDescription>
        <CardDescription className="lg:hidden">
          Touchez une carte pour ouvrir la fiche détail
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <CoursesTableSkeleton />
        ) : isError ? (
          <div className="space-y-3 p-4">
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
        ) : courses.length > 0 ? (
          <>
            <ul className="divide-y divide-line lg:hidden">
              {courses.map((course) => (
                <li key={course.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 p-4 text-left active:bg-paper"
                    onClick={() => onOpenCourse(course.id)}
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
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                          CR manquant
                        </span>
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b bg-paper text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Titre / matière</th>
                  <th className="px-4 py-3 font-medium">Professeur</th>
                  <th className="px-4 py-3 font-medium">Élève</th>
                  {showCampus ? (
                    <th className="px-4 py-3 font-medium">Campus</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Indicateurs</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-paper"
                    onClick={() => onOpenCourse(course.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                      {formatCourseSessionWhen(course.starts_at, course.ends_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">
                        {courseDisplayTitle(course)}
                      </p>
                      {course.subject && course.title !== course.subject ? (
                        <p className="text-xs text-ink-400">{course.title}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {course.provider_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {course.client_name ?? "—"}
                    </td>
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
                      <div className="flex flex-wrap gap-1">
                        {course.missing_summary ? (
                          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                            CR manquant
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <p className="p-4 text-sm text-ink-400">
            {getEmptyStateMessage(filters)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
