import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { Clock } from "lucide-react";
import { formatEventTime } from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  formatRelativeWhen,
  formatSessionDate,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { getTutorName } from "./studentCockpitUtils";

interface StudentNextCourseHeroProps {
  course: ScheduleEvent | undefined;
}

export function StudentNextCourseHero({ course }: StudentNextCourseHeroProps) {
  if (!course) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-surface-alt px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Prochain cours
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink-900">
          Aucun cours réservé
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Parcourez les professeurs de votre campus et réservez un créneau pour
          commencer votre tutorat.
        </p>
        <Button className="mt-5" variant="brand" asChild>
          <Link to="/app/cours">Trouver mon tuteur</Link>
        </Button>
      </section>
    );
  }

  const tutorName = getTutorName(course);
  const relativeWhen = formatRelativeWhen(course.startsAt);

  return (
    <section
      className="rounded-lg border border-brand-100 bg-surface p-6 shadow-raised sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Prochain cours
          </p>
          <div className="mt-3 flex items-center gap-2 text-accent-600">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-semibold tabular-nums">{relativeWhen}</span>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            {tutorName}
          </h3>
          <p className="mt-1 text-sm text-ink-600">{course.title}</p>
          <p className="mt-2 text-sm text-ink-600">
            {formatSessionDate(course.startsAt)}
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums text-ink-900">
            {formatEventTime(course.startsAt, course.endsAt)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Button size="sm" variant="brand" asChild>
            <Link to="/app/planning">Voir l&apos;emploi du temps</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/cours">Voir les tuteurs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
