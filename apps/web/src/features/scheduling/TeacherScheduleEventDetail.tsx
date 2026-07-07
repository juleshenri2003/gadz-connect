import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { StarRatingDisplay } from "@/features/ratings/StarRating";
import { formatEuro } from "@/features/admin/format";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import { useDeleteSlot } from "@/features/marketplace/useTutors";
import {
  courseStatusLabel,
  eventKindLabel,
  formatEventTime,
  formatSessionDurationLabel,
} from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  estimateSessionNet,
  formatSessionWhen,
  getSessionLabel,
  isConfirmedSession,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

interface TeacherScheduleEventDetailProps {
  event: ScheduleEvent | null;
  open: boolean;
  onClose: () => void;
  hourlyRate: number | null;
  statusAcre: boolean;
  versementLiberatoire: boolean;
}

export function TeacherScheduleEventDetail({
  event,
  open,
  onClose,
  hourlyRate,
  statusAcre,
  versementLiberatoire,
}: TeacherScheduleEventDetailProps) {
  const deleteSlot = useDeleteSlot();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!event) return null;

  const title =
    event.kind === "slot_available" ? "Créneau ouvert" : getSessionLabel(event);
  const duration = formatSessionDurationLabel(event.startsAt, event.endsAt);
  const estimatedNet =
    isConfirmedSession(event) && hourlyRate
      ? estimateSessionNet(
          event,
          hourlyRate,
          statusAcre,
          versementLiberatoire,
        )
      : null;
  const deletableSlot =
    event.kind === "slot_available" &&
    (event.slotId ?? event.id) &&
    !event.courseId;

  async function handleDeleteSlot() {
    const slotId = event!.slotId ?? event!.id;
    setDeleteError(null);
    try {
      await deleteSlot.mutateAsync(slotId);
      onClose();
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={event.title !== title ? event.title : undefined}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Statut
          </dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {eventKindLabel(event.kind, event.status)}
            {event.status && event.status !== "scheduled"
              ? ` · ${courseStatusLabel(event.status) ?? event.status}`
              : null}
          </dd>
        </div>
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
        {estimatedNet != null ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Estimation nette
            </dt>
            <dd className="mt-0.5 text-ink-900">~{formatEuro(estimatedNet)}</dd>
          </div>
        ) : null}
        {event.rating ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Avis élève
            </dt>
            <dd className="mt-1">
              <StarRatingDisplay value={event.rating.stars} />
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {event.courseId && event.status === "scheduled" ? (
          <DeclareUnavailableButton
            courseId={event.courseId}
            eventTitle={event.title}
            courseStatus={event.status}
            compact
          />
        ) : null}

        {event.courseId ? (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/suivi-cours">Suivi & évaluations</Link>
            </Button>
            {!event.hasSummary ? (
              <Button size="sm" variant="outline" asChild>
                <Link to={coursesTabHref("documentation")}>Documenter le cours</Link>
              </Button>
            ) : null}
          </>
        ) : null}

        {deletableSlot ? (
          <Button
            size="sm"
            variant="outline"
            disabled={deleteSlot.isPending}
            onClick={() => void handleDeleteSlot()}
          >
            {deleteSlot.isPending ? "Suppression…" : "Supprimer le créneau"}
          </Button>
        ) : null}
      </div>

      {!event.courseId && event.kind === "slot_booked" ? (
        <p className="mt-4 text-sm text-warning">
          Réservation détectée —{" "}
          <Link to="/app/alertes" className="font-medium underline">
            contactez le campus
          </Link>{" "}
          si vous ne pouvez pas assurer ce créneau.
        </p>
      ) : null}

      {deleteError ? (
        <p className="mt-3 text-sm text-danger">{deleteError}</p>
      ) : null}
    </Modal>
  );
}
