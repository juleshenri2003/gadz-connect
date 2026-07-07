import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { Modal } from "@/components/Modal";
import {
  CourseRatingForm,
  CourseRatingSummary,
} from "@/features/ratings/CourseRatingForm";
import {
  formatEventTime,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import {
  buildMarketplaceSubjectHref,
  formatNotificationDate,
} from "@/features/notifications/notificationUtils";
import type { ScheduleEvent } from "@/features/scheduling/types";

interface StudentScheduleEventDetailProps {
  event: ScheduleEvent | null;
  open: boolean;
  onClose: () => void;
}

export function StudentScheduleEventDetail({
  event,
  open,
  onClose,
}: StudentScheduleEventDetailProps) {
  if (!event) return null;

  const past = isEventPast(event.startsAt, event.endsAt);
  const canDeclareUnavailable =
    event.kind === "course" &&
    event.courseId &&
    event.status === "scheduled" &&
    !past;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.title}
      description={
        event.counterpartName
          ? `Avec ${event.counterpartName}`
          : undefined
      }
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-ink-600">
        <p>
          <span className="font-medium text-ink-900">Date :</span>{" "}
          {formatNotificationDate(event.startsAt)}
        </p>
        <p>
          <span className="font-medium text-ink-900">Horaire :</span>{" "}
          {formatEventTime(event.startsAt, event.endsAt)}
        </p>
        {event.status === "cancelled" ? (
          <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-600">
            Cette séance a été annulée.{" "}
            <Link
              to={buildMarketplaceSubjectHref(event.title)}
              className="font-medium text-brand-700 underline"
            >
              Trouver un autre tuteur
            </Link>
          </p>
        ) : null}
        {canDeclareUnavailable ? (
          <DeclareUnavailableButton
            courseId={event.courseId!}
            eventTitle={event.title}
            courseStatus={event.status ?? "scheduled"}
            audience="student"
          />
        ) : null}
        {event.rating ? (
          <CourseRatingSummary
            stars={event.rating.stars}
            createdAt={event.rating.createdAt}
          />
        ) : event.canRate && event.courseId ? (
          <CourseRatingForm
            courseId={event.courseId}
            courseTitle={event.title}
          />
        ) : past && event.courseId ? (
          <p className="text-sm text-ink-600">
            <Link
              to="/app/suivi-cours"
              className="font-medium text-brand-700 underline"
            >
              Voir le suivi complet du cours
            </Link>
            {" "}
            (compte-rendu, fiches, échanges).
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
