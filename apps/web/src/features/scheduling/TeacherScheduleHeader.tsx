import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { formatEuro } from "@/features/admin/format";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import { TeacherSlotQuickPublish } from "@/features/dashboard/teacher-cockpit/TeacherSlotQuickPublish";
import {
  estimateSessionNet,
  formatRelativeWhen,
  formatSessionWhen,
  getSessionLabel,
  getUpcomingEvents,
  isConfirmedSession,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import type { ScheduleEvent } from "./types";

interface TeacherScheduleHeaderProps {
  events: ScheduleEvent[];
  hourlyRate: number | null;
  statusAcre: boolean;
  versementLiberatoire: boolean;
}

export function TeacherScheduleHeader({
  events,
  hourlyRate,
  statusAcre,
  versementLiberatoire,
}: TeacherScheduleHeaderProps) {
  const [showQuickPublish, setShowQuickPublish] = useState(false);
  const upcoming = getUpcomingEvents(events);
  const nextSession =
    upcoming.find(isConfirmedSession) ?? upcoming[0] ?? undefined;
  const estimatedNet =
    nextSession && isConfirmedSession(nextSession)
      ? estimateSessionNet(
          nextSession,
          hourlyRate,
          statusAcre,
          versementLiberatoire,
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-ink-900">Emploi du temps</h2>
          <p className="mt-1 text-sm text-ink-600">
            Vos créneaux et cours planifiés
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={coursesTabHref("slots")}>Gérer mes créneaux</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowQuickPublish((v) => !v)}
          >
            {showQuickPublish ? "Masquer le formulaire" : "Publier un créneau"}
          </Button>
        </div>
      </div>

      {showQuickPublish ? (
        <TeacherSlotQuickPublish embedded />
      ) : null}

      <div className="rounded-md border border-line bg-surface px-4 py-3">
        {nextSession ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Prochaine session
              </p>
              <p className="mt-1 font-medium text-ink-900">
                {isConfirmedSession(nextSession)
                  ? getSessionLabel(nextSession)
                  : "Créneau ouvert aux réservations"}
              </p>
              <p className="mt-0.5 text-sm text-ink-600">
                {formatSessionWhen(nextSession.startsAt, nextSession.endsAt)}
              </p>
              {estimatedNet != null ? (
                <p className="mt-1 text-xs text-ink-400">
                  Estimation nette ~{formatEuro(estimatedNet)}
                </p>
              ) : null}
            </div>
            <span className="text-sm font-medium text-ink-400">
              {formatRelativeWhen(nextSession.startsAt)}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-600">
              Aucune session à venir — publiez des créneaux pour recevoir des
              réservations.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowQuickPublish(true)}
            >
              Publier un créneau →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
