import { useState } from "react";
import { Button } from "@gadz-connect/ui";
import {
  useConfirmSession,
  usePingSession,
} from "@/features/course-session/useCourseSession";

interface ConfirmSessionActionsProps {
  courseId: string;
  audience: "student" | "teacher";
  studentConfirmedAt?: string | null;
  providerConfirmedAt?: string | null;
  compact?: boolean;
}

export function ConfirmSessionActions({
  courseId,
  audience,
  studentConfirmedAt: studentConfirmedAtProp,
  providerConfirmedAt: providerConfirmedAtProp,
  compact = false,
}: ConfirmSessionActionsProps) {
  const confirm = useConfirmSession();
  const ping = usePingSession();
  const [confirmedAt, setConfirmedAt] = useState<{
    student: string | null;
    provider: string | null;
  } | null>(null);

  const studentConfirmedAt =
    confirmedAt?.student ?? studentConfirmedAtProp ?? null;
  const providerConfirmedAt =
    confirmedAt?.provider ?? providerConfirmedAtProp ?? null;

  const selfConfirmed =
    audience === "student"
      ? Boolean(studentConfirmedAt)
      : Boolean(providerConfirmedAt);
  const otherConfirmed =
    audience === "student"
      ? Boolean(providerConfirmedAt)
      : Boolean(studentConfirmedAt);

  return (
    <div className={compact ? "space-y-2" : "space-y-3 rounded-md border border-line bg-paper p-3"}>
      {!compact ? (
        <p className="text-sm font-medium text-ink-900">Confirmation de séance</p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={
            providerConfirmedAt
              ? "rounded-full bg-success-bg px-2 py-0.5 font-medium text-success"
              : "rounded-full bg-paper px-2 py-0.5 text-ink-500"
          }
        >
          Prof {providerConfirmedAt ? "✓" : "—"}
        </span>
        <span
          className={
            studentConfirmedAt
              ? "rounded-full bg-success-bg px-2 py-0.5 font-medium text-success"
              : "rounded-full bg-paper px-2 py-0.5 text-ink-500"
          }
        >
          Élève {studentConfirmedAt ? "✓" : "—"}
        </span>
      </div>
      {!selfConfirmed ? (
        <Button
          type="button"
          size="sm"
          disabled={confirm.isPending}
          onClick={() =>
            void confirm.mutateAsync(courseId).then((data) => {
              setConfirmedAt({
                student: data.student_confirmed_at,
                provider: data.provider_confirmed_at,
              });
            })
          }
        >
          {confirm.isPending ? "Confirmation…" : "Je confirme ma présence"}
        </Button>
      ) : (
        <p className="text-xs text-success">Vous avez confirmé votre présence.</p>
      )}
      {!otherConfirmed ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={ping.isPending}
          onClick={() =>
            void ping.mutateAsync({
              courseId,
              message: "Toujours bon pour demain ? Merci de confirmer votre présence.",
            })
          }
        >
          {ping.isPending ? "Envoi…" : "Relancer l'autre partie"}
        </Button>
      ) : null}
    </div>
  );
}
