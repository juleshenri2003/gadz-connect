import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { Modal } from "@/components/Modal";
import {
  formatEventTime,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
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
        {event.status === "awaiting_replacement" ? (
          <p className="rounded-md border border-warning/20 bg-warning-bg px-3 py-2 text-xs text-warning">
            Remplacement en cours — consultez{" "}
            <Link to="/app/alertes" className="font-medium underline">
              Alertes campus
            </Link>{" "}
            pour choisir un remplaçant.
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
      </div>
    </Modal>
  );
}
