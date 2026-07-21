import { useState } from "react";
import { Button } from "@gadz-connect/ui";
import { useConfirmAttendance } from "@/features/course-session/useCourseSession";

interface ConfirmAttendanceActionsProps {
  courseId: string;
  audience: "student" | "teacher";
  studentSessionConfirmedAt?: string | null;
  providerSessionConfirmedAt?: string | null;
  sessionConfirmationCompletedAt?: string | null;
  sessionDisputeStatus?: string | null;
  compact?: boolean;
}

export function ConfirmAttendanceActions({
  courseId,
  audience,
  studentSessionConfirmedAt: studentProp,
  providerSessionConfirmedAt: providerProp,
  sessionConfirmationCompletedAt: completedProp,
  sessionDisputeStatus = "none",
  compact = false,
}: ConfirmAttendanceActionsProps) {
  const confirm = useConfirmAttendance();
  const [local, setLocal] = useState<{
    student: string | null;
    provider: string | null;
    completed: string | null;
  } | null>(null);

  const studentAt = local?.student ?? studentProp ?? null;
  const providerAt = local?.provider ?? providerProp ?? null;
  const completedAt = local?.completed ?? completedProp ?? null;

  const selfConfirmed =
    audience === "student" ? Boolean(studentAt) : Boolean(providerAt);
  const otherConfirmed =
    audience === "student" ? Boolean(providerAt) : Boolean(studentAt);

  if (sessionDisputeStatus === "open") {
    return (
      <div
        className={
          compact
            ? "space-y-1"
            : "space-y-2 rounded-md border border-warning/40 bg-warning-bg p-3"
        }
      >
        <p className="text-sm font-medium text-ink-900">Litige ouvert</p>
        <p className="text-xs text-ink-600">
          La double confirmation n&apos;a pas été obtenue sous 7 jours. Un
          administrateur doit valider le paiement ou rembourser.
        </p>
      </div>
    );
  }

  if (completedAt || (studentAt && providerAt)) {
    return (
      <div
        className={
          compact
            ? "space-y-1"
            : "space-y-2 rounded-md border border-success/30 bg-success-bg p-3"
        }
      >
        <p className="text-sm font-medium text-success">
          Séance confirmée par les deux parties
        </p>
        <p className="text-xs text-ink-600">
          Le reversement au professeur est en cours ou terminé.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "space-y-2"
          : "space-y-3 rounded-md border border-line bg-paper p-3"
      }
    >
      {!compact ? (
        <div>
          <p className="text-sm font-medium text-ink-900">
            Confirmer que le cours a eu lieu
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Élève et professeur doivent valider pour débloquer le paiement.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={
            providerAt
              ? "rounded-full bg-success-bg px-2 py-0.5 font-medium text-success"
              : "rounded-full bg-paper px-2 py-0.5 text-ink-500"
          }
        >
          Prof {providerAt ? "✓" : "—"}
        </span>
        <span
          className={
            studentAt
              ? "rounded-full bg-success-bg px-2 py-0.5 font-medium text-success"
              : "rounded-full bg-paper px-2 py-0.5 text-ink-500"
          }
        >
          Élève {studentAt ? "✓" : "—"}
        </span>
      </div>
      {!selfConfirmed ? (
        <Button
          type="button"
          size="sm"
          disabled={confirm.isPending}
          onClick={() =>
            void confirm.mutateAsync(courseId).then((data) => {
              setLocal({
                student: data.student_session_confirmed_at,
                provider: data.provider_session_confirmed_at,
                completed: data.session_confirmation_completed_at,
              });
            })
          }
        >
          {confirm.isPending
            ? "Confirmation…"
            : "Je confirme que le cours a eu lieu"}
        </Button>
      ) : (
        <p className="text-xs text-success">
          Vous avez confirmé.
          {!otherConfirmed
            ? " En attente de l'autre partie."
            : ""}
        </p>
      )}
    </div>
  );
}
