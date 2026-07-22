import { useState } from "react";
import { Button, Input, Label, cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { ConfirmAttendanceActions } from "@/features/course-session/ConfirmAttendanceActions";
import {
  CourseRatingForm,
  CourseRatingSummary,
} from "@/features/ratings/CourseRatingForm";
import {
  courseStatusLabel,
  eventStyles,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import {
  formatSessionWhen,
  sessionDurationHours,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import {
  planningWeekLink,
  summaryDeepLink,
} from "@/features/repository/studentRepositoryUtils";
import { useSubmitCourseSummary } from "@/features/repository/useRepository";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import type { ScheduleEvent } from "@/features/scheduling/types";

interface PastCoursesPanelProps {
  audience: "student" | "teacher";
  /** Accordion fermé par défaut (page élève). */
  collapsible?: boolean;
  /** Nombre max d’items avant « Voir plus ». */
  initialLimit?: number;
}

export function needsAttendanceConfirm(event: ScheduleEvent): boolean {
  if (!event.courseId) return false;
  if (event.status === "cancelled" || event.status === "awaiting_replacement") {
    return false;
  }
  if (event.sessionConfirmationCompletedAt) return false;
  if (event.studentSessionConfirmedAt && event.providerSessionConfirmedAt) {
    return false;
  }
  return (
    event.status === "awaiting_session_confirmation" ||
    (isEventPast(event.startsAt, event.endsAt) &&
      (event.status === "scheduled" || event.status === "completed"))
  );
}

/** True si l’utilisateur courant doit encore confirmer (pas l’autre partie). */
export function needsOwnAttendanceConfirm(
  event: ScheduleEvent,
  audience: "student" | "teacher",
): boolean {
  if (!needsAttendanceConfirm(event)) return false;
  if (audience === "student") {
    return !(
      event.studentSessionConfirmedAt ?? event.studentConfirmedAt
    );
  }
  return !(
    event.providerSessionConfirmedAt ?? event.providerConfirmedAt
  );
}

function canDepositSummary(event: ScheduleEvent): boolean {
  if (!event.courseId) return false;
  if (event.hasSummary) return false;
  if (event.status === "cancelled") return false;
  return true;
}

function counterpartLabel(
  event: ScheduleEvent,
  audience: "student" | "teacher",
): string {
  if (audience === "student") {
    return event.counterpartName ?? event.providerName ?? "Professeur";
  }
  return event.counterpartName ?? event.clientName ?? "Élève";
}

export function getPastCourseEvents(
  events: ScheduleEvent[] | undefined,
): ScheduleEvent[] {
  const now = Date.now();
  return (events ?? [])
    .filter(
      (event) =>
        event.kind === "course" && new Date(event.startsAt).getTime() <= now,
    )
    .sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
}

function formatHours(hours: number): string {
  if (hours === 0) return "0 h";
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

function computeTeacherHistoryStats(events: ScheduleEvent[]) {
  const countable = events.filter((e) => e.status !== "cancelled");
  const hours = countable.reduce(
    (sum, e) => sum + sessionDurationHours(e.startsAt, e.endsAt),
    0,
  );
  const pendingConfirm = countable.filter(needsAttendanceConfirm).length;
  const pendingDoc = countable.filter(canDepositSummary).length;
  return {
    hours: Math.round(hours * 10) / 10,
    sessions: countable.length,
    pendingConfirm,
    pendingDoc,
  };
}

export function PastCoursesPanel({
  audience,
  collapsible = false,
  initialLimit = 8,
}: PastCoursesPanelProps) {
  const { data, isLoading, isError } = useMySchedule({
    includeCancelled: true,
  });
  const past = getPastCourseEvents(data?.events);
  const pendingConfirm = past.filter(needsAttendanceConfirm).length;
  const pendingDoc =
    audience === "teacher" ? past.filter(canDepositSummary).length : 0;
  const stats =
    audience === "teacher" ? computeTeacherHistoryStats(past) : null;

  const badgeParts: string[] = [];
  if (pendingConfirm > 0) badgeParts.push(`${pendingConfirm} à confirmer`);
  if (pendingDoc > 0) badgeParts.push(`${pendingDoc} sans résumé`);

  const body = (
    <PastCoursesList
      audience={audience}
      events={past}
      isLoading={isLoading}
      isError={isError}
      initialLimit={initialLimit}
      stats={stats}
    />
  );

  if (collapsible) {
    return (
      <details className="group rounded-md border border-line bg-surface open:shadow-surface">
        <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-ink-900">Voir les cours passés</p>
              <p className="mt-0.5 text-sm text-ink-600">
                Historique de vos séances
                {past.length > 0 ? ` (${past.length})` : ""}
              </p>
            </div>
            {badgeParts.length > 0 ? (
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
                {badgeParts.join(" · ")}
              </span>
            ) : null}
          </div>
        </summary>
        <div className="border-t border-line px-5 pb-5 pt-4">{body}</div>
      </details>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Cours passés</h3>
          <p className="mt-1 text-sm text-ink-600">
            {audience === "teacher"
              ? "Confirmez les séances, déposez un résumé et suivez votre volume d'heures."
              : "Historique de vos séances — confirmez la présence et consultez les comptes-rendus."}
          </p>
        </div>
        {badgeParts.length > 0 ? (
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
            {badgeParts.join(" · ")}
          </span>
        ) : null}
      </div>
      {body}
    </section>
  );
}

function PastCoursesList({
  audience,
  events,
  isLoading,
  isError,
  initialLimit,
  stats,
}: {
  audience: "student" | "teacher";
  events: ScheduleEvent[];
  isLoading: boolean;
  isError: boolean;
  initialLimit: number;
  stats: ReturnType<typeof computeTeacherHistoryStats> | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, initialLimit);

  if (isLoading) {
    return (
      <p className="text-sm text-ink-400">Chargement de l&apos;historique…</p>
    );
  }
  if (isError) {
    return (
      <p className="text-sm text-danger" role="alert">
        Impossible de charger les cours passés.
      </p>
    );
  }
  if (events.length === 0) {
    return (
      <p className="text-sm text-ink-400">Aucun cours passé pour le moment.</p>
    );
  }

  return (
    <div className="space-y-3">
      {stats ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Heures réalisées
            </p>
            <p className="mt-0.5 text-lg font-semibold text-ink-900">
              {formatHours(stats.hours)}
            </p>
            <p className="text-xs text-ink-500">
              {stats.sessions} séance{stats.sessions > 1 ? "s" : ""} (hors
              annulées)
            </p>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              À confirmer
            </p>
            <p className="mt-0.5 text-lg font-semibold text-ink-900">
              {stats.pendingConfirm}
            </p>
            <p className="text-xs text-ink-500">
              Double validation avant reversement
            </p>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Sans résumé
            </p>
            <p className="mt-0.5 text-lg font-semibold text-ink-900">
              {stats.pendingDoc}
            </p>
            <p className="text-xs text-ink-500">À déposer pour l&apos;élève</p>
          </div>
        </div>
      ) : null}

      <ul className="space-y-3">
        {visible.map((event) => (
          <PastCourseRow key={event.id} event={event} audience={audience} />
        ))}
      </ul>
      {events.length > initialLimit ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Réduire"
            : `Voir les ${events.length - initialLimit} autres`}
        </Button>
      ) : null}
      <p className="text-sm text-ink-600">
        <Link
          to="/app/planning"
          className="font-medium text-brand-700 hover:underline"
        >
          Voir dans mon emploi du temps →
        </Link>
      </p>
    </div>
  );
}

function PastCourseRow({
  event,
  audience,
}: {
  event: ScheduleEvent;
  audience: "student" | "teacher";
}) {
  const status = courseStatusLabel(event.status) ?? "Cours";
  const showConfirm = needsAttendanceConfirm(event);
  const name = counterpartLabel(event, audience);
  const hours = sessionDurationHours(event.startsAt, event.endsAt);

  return (
    <li className="rounded-lg border border-line bg-paper/80 px-3 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                eventStyles(
                  event.kind,
                  event.status,
                  event.startsAt,
                  event.endsAt,
                ),
              )}
            >
              {status}
            </span>
            {showConfirm ? (
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
                Confirmation requise
              </span>
            ) : null}
            {audience === "teacher" && canDepositSummary(event) ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                Résumé manquant
              </span>
            ) : null}
            {audience === "teacher" && event.hasSummary ? (
              <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                Documenté
              </span>
            ) : null}
          </div>
          <p className="font-medium text-ink-900">{event.title}</p>
          <p className="text-ink-600">
            {audience === "student" ? "Avec" : "Élève"} {name}
          </p>
          <p className="text-xs text-ink-500">
            {formatSessionWhen(event.startsAt, event.endsAt)}
            {hours > 0 ? ` · ${formatHours(hours)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.hasSummary && event.folderId && event.summaryId ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={summaryDeepLink(event.folderId, event.summaryId)}>
                Compte-rendu →
              </Link>
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" asChild>
            <Link to={planningWeekLink(event.startsAt)}>Planning →</Link>
          </Button>
        </div>
      </div>

      {showConfirm && event.courseId ? (
        <div className="mt-3">
          <ConfirmAttendanceActions
            courseId={event.courseId}
            audience={audience}
            studentSessionConfirmedAt={event.studentSessionConfirmedAt}
            providerSessionConfirmedAt={event.providerSessionConfirmedAt}
            sessionConfirmationCompletedAt={
              event.sessionConfirmationCompletedAt
            }
            sessionDisputeStatus={event.sessionDisputeStatus}
            compact
            confirmLabel="Confirmer que le cours a eu lieu"
          />
        </div>
      ) : null}

      {audience === "teacher" && canDepositSummary(event) && event.courseId ? (
        <div className="mt-3">
          <CourseSummaryDeposit
            courseId={event.courseId}
            subject={event.title}
          />
        </div>
      ) : null}

      {audience === "student" && event.courseId ? (
        <div className="mt-3">
          {event.rating ? (
            <CourseRatingSummary
              stars={event.rating.stars}
              createdAt={event.rating.createdAt}
            />
          ) : event.canRate ? (
            <CourseRatingForm
              courseId={event.courseId}
              courseTitle={event.title}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function CourseSummaryDeposit({
  courseId,
  subject,
}: {
  courseId: string;
  subject: string;
}) {
  const submit = useSubmitCourseSummary();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Session ${subject}`);
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <p className="text-sm text-success" role="status">
        Résumé publié — visible dans le répertoire matière de l&apos;élève.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true);
          setTitle(`Session ${subject}`);
          setContent("");
        }}
      >
        Déposer le résumé
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-line bg-surface p-3">
      <p className="text-xs font-medium text-ink-700">
        Résumé pour le répertoire élève
      </p>
      <div className="space-y-1">
        <Label htmlFor={`doc-title-${courseId}`}>Titre</Label>
        <Input
          id={`doc-title-${courseId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`doc-content-${courseId}`}>
          Notions importantes du cours
        </Label>
        <textarea
          id={`doc-content-${courseId}`}
          className="min-h-[80px] w-full rounded-md border border-line p-2 text-sm"
          placeholder="Points clés, exercices vus, conseils pour la suite…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={submit.isPending || !title.trim() || !content.trim()}
          onClick={() => {
            void submit
              .mutateAsync({
                courseId,
                title: title.trim(),
                content: content.trim(),
              })
              .then(() => {
                setPublished(true);
                setOpen(false);
              });
          }}
        >
          {submit.isPending ? "Enregistrement…" : "Publier le résumé"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
      </div>
      {submit.isError ? (
        <p className="text-sm text-danger" role="alert">
          {(submit.error as Error).message}
        </p>
      ) : null}
    </div>
  );
}
