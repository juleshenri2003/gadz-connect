import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import {
  eventKindLabel,
  eventStyles,
} from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  formatSessionWhen,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { getTutorName } from "./studentCockpitUtils";
import { summaryDeepLink } from "@/features/repository/studentRepositoryUtils";

interface StudentRecentHistoryProps {
  events: ScheduleEvent[];
}

export function StudentRecentHistory({ events }: StudentRecentHistoryProps) {
  const recent = events.slice(0, 5);

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <h3 className="font-semibold text-ink-900">Historique récent</h3>
      <p className="mt-1 text-sm text-ink-600">
        Vos dernières sessions de tutorat.
      </p>

      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">
          Aucun cours passé enregistré.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    eventStyles(event.kind, event.status),
                  )}
                >
                  {eventKindLabel(event.kind, event.status)}
                </span>
                {event.hasSummary ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      to={
                        event.folderId && event.summaryId
                          ? summaryDeepLink(event.folderId, event.summaryId)
                          : "/app/repertoire"
                      }
                    >
                      Compte-rendu →
                    </Link>
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 font-medium text-ink-900">
                {getTutorName(event)}
              </p>
              <p className="mt-0.5 text-xs text-ink-600">{event.title}</p>
              <p className="mt-0.5 text-ink-600">
                {formatSessionWhen(event.startsAt, event.endsAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
