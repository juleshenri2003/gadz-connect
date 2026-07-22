import { Link } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import {
  eventKindLabel,
  eventStyles,
} from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { formatSessionWhen } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { getTutorName } from "./studentCockpitUtils";
import { summaryDeepLink } from "@/features/repository/studentRepositoryUtils";

interface StudentRecentHistoryProps {
  events: ScheduleEvent[];
}

export function StudentRecentHistory({ events }: StudentRecentHistoryProps) {
  const recent = events.slice(0, 4);

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">Historique récent</h3>
          <p className="mt-1 text-sm text-ink-600">
            Vos dernières sessions de tutorat.
          </p>
        </div>
        <Link
          to="/app/suivi-cours"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Suivi →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">
          Aucun cours passé enregistré.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {recent.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      eventStyles(event.kind, event.status),
                    )}
                  >
                    {eventKindLabel(event.kind, event.status)}
                  </span>
                  <p className="font-medium text-ink-900">
                    {getTutorName(event)}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-600">
                  {event.title}
                  {" · "}
                  {formatSessionWhen(event.startsAt, event.endsAt)}
                </p>
              </div>
              {event.hasSummary ? (
                <Link
                  to={
                    event.folderId && event.summaryId
                      ? summaryDeepLink(event.folderId, event.summaryId)
                      : "/app/repertoire"
                  }
                  className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
                >
                  Compte-rendu →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
