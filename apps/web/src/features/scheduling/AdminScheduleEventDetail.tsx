import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { Modal } from "@/components/Modal";
import {
  courseStatusLabel,
  eventKindLabel,
  eventStyles,
  formatEventTime,
  formatSessionDurationLabel,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import {
  buildAdminAlertHref,
  buildAdminMembersHref,
  buildAdminPlanningHref,
  formatWeekParam,
} from "@/features/scheduling/adminScheduleUtils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { formatSessionWhen } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

interface AdminScheduleEventDetailProps {
  event: ScheduleEvent | null;
  open: boolean;
  onClose: () => void;
}

export function AdminScheduleEventDetail({
  event,
  open,
  onClose,
}: AdminScheduleEventDetailProps) {
  if (!event) return null;

  const duration = formatSessionDurationLabel(event.startsAt, event.endsAt);
  const past = isEventPast(event.startsAt, event.endsAt);
  const missingSummary =
    past && !event.hasSummary && event.status !== "cancelled";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.title}
      description={event.campusName ?? undefined}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
            eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
          )}
        >
          {eventKindLabel(event.kind, event.status)}
        </span>
        {missingSummary ? (
          <span className="ml-2 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
            Compte-rendu manquant
          </span>
        ) : null}
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Horaire
          </dt>
          <dd className="mt-0.5 text-ink-900">
            {formatSessionWhen(event.startsAt, event.endsAt)}
            <span className="ml-2 text-ink-400">
              ({formatEventTime(event.startsAt, event.endsAt)})
            </span>
          </dd>
        </div>
        {duration ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Durée
            </dt>
            <dd className="mt-0.5 text-ink-900">{duration}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Statut
          </dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {courseStatusLabel(event.status) ?? event.status ?? "—"}
          </dd>
        </div>
        {event.providerName ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Professeur
            </dt>
            <dd className="mt-0.5">
              <Link
                to={buildAdminMembersHref(event.providerName)}
                className="font-medium text-brand-700 hover:underline"
              >
                {event.providerName}
              </Link>
            </dd>
          </div>
        ) : null}
        {event.clientName ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Élève
            </dt>
            <dd className="mt-0.5">
              <Link
                to={buildAdminMembersHref(event.clientName)}
                className="font-medium text-brand-700 hover:underline"
              >
                {event.clientName}
              </Link>
            </dd>
          </div>
        ) : null}
        {event.campusName ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Campus
            </dt>
            <dd className="mt-0.5 text-ink-900">{event.campusName}</dd>
          </div>
        ) : null}
        {event.replacementProposalCount != null &&
        event.replacementProposalCount > 0 ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Propositions de remplacement
            </dt>
            <dd className="mt-0.5 text-ink-900">
              {event.replacementProposalCount} professeur
              {event.replacementProposalCount > 1 ? "s" : ""} intéressé
              {event.replacementProposalCount > 1 ? "s" : ""}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Identifiant cours
          </dt>
          <dd className="mt-0.5 font-mono text-xs text-ink-600">
            {event.courseId ?? event.id}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {event.status === "awaiting_replacement" ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={buildAdminAlertHref(event.replacementNotificationId)}>
              Voir l&apos;alerte campus
            </Link>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" asChild>
          <Link
            to={buildAdminPlanningHref({
              week: formatWeekParam(new Date(event.startsAt)),
              campusId: event.campusId,
              view: "week",
            })}
          >
            Voir dans le planning
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/cours">Liste des cours</Link>
        </Button>
      </div>
    </Modal>
  );
}
