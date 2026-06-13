import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { Clock } from "lucide-react";
import { formatEuro } from "@/features/admin/format";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import { formatEventTime } from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  formatRelativeWhen,
  formatSessionDate,
  getSessionLabel,
  isConfirmedSession,
} from "./teacherCockpitUtils";

interface TeacherNextSessionHeroProps {
  session: ScheduleEvent | undefined;
  estimatedNet: number | null;
}

export function TeacherNextSessionHero({
  session,
  estimatedNet,
}: TeacherNextSessionHeroProps) {
  if (!session) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-surface-alt px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Prochaine session
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink-900">
          Aucune session planifiée
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Publiez des créneaux pour apparaître aux élèves de votre campus et
          recevoir vos premières réservations.
        </p>
        <Button className="mt-5" variant="brand" asChild>
          <Link to={coursesTabHref("slots")}>Publier un créneau</Link>
        </Button>
      </section>
    );
  }

  const confirmed = isConfirmedSession(session);
  const relativeWhen = formatRelativeWhen(session.startsAt);

  return (
    <section
      className={cn(
        "rounded-lg border bg-surface p-6 shadow-raised sm:p-8",
        confirmed ? "border-brand-100" : "border-success/20",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {confirmed ? "Prochain cours" : "Prochain créneau ouvert"}
          </p>
          <div
            className={cn(
              "mt-3 flex items-center gap-2",
              confirmed ? "text-brand-600" : "text-success",
            )}
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-semibold tabular-nums">{relativeWhen}</span>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            {getSessionLabel(session)}
          </h3>
          <p className="mt-2 text-sm text-ink-600">
            {formatSessionDate(session.startsAt)}
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums text-ink-900">
            {formatEventTime(session.startsAt, session.endsAt)}
          </p>
          {estimatedNet != null ? (
            <p className="mt-3 text-sm font-semibold tabular-nums text-brand-700">
              ~{formatEuro(estimatedNet)} net estimé
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Button size="sm" variant="brand" asChild>
            <Link to="/app/planning">Emploi du temps</Link>
          </Button>
          {!confirmed ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={coursesTabHref("slots")}>Gérer mes créneaux</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
