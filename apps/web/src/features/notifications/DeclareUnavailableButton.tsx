import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useDeclareUnavailable } from "./useNotifications";

interface DeclareUnavailableButtonProps {
  courseId: string;
  eventTitle: string;
  courseStatus?: string;
  compact?: boolean;
  audience?: "teacher" | "student";
}

export function DeclareUnavailableButton({
  courseId,
  eventTitle,
  courseStatus = "scheduled",
  compact = false,
  audience = "teacher",
}: DeclareUnavailableButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const declare = useDeclareUnavailable();
  const isStudentAudience = audience === "student";

  if (courseStatus !== "scheduled") {
    return null;
  }

  async function handleConfirm() {
    setErrorMessage(null);
    try {
      await declare.mutateAsync({
        courseId,
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      setReason("");
      setSuccessMessage(
        isStudentAudience
          ? "Séance annulée — le créneau est libéré."
          : "Séance annulée — l'élève est notifié et peut réserver un autre tuteur.",
      );
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  if (successMessage) {
    return (
      <p className="mt-2 text-xs font-medium text-warning">{successMessage}</p>
    );
  }

  const buttonLabel = "Annuler la séance";

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={
          compact
            ? "mt-2 h-7 text-xs"
            : "mt-2 h-7 w-full text-[10px]"
        }
        onClick={() => setOpen(true)}
      >
        {buttonLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!declare.isPending) setOpen(false);
        }}
        title="Annuler la séance"
        description={`Vous ne pourrez pas assurer « ${eventTitle} ».`}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={declare.isPending}
              onClick={() => setOpen(false)}
            >
              Retour
            </Button>
            <Button
              type="button"
              disabled={declare.isPending}
              onClick={() => void handleConfirm()}
            >
              {declare.isPending ? "Annulation…" : "Confirmer l'annulation"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          {isStudentAudience
            ? "La séance sera annulée et le créneau libéré sur le marketplace."
            : "La séance sera annulée, le créneau libéré, et l'élève pourra réserver un autre tuteur sur la marketplace."}
        </p>
        <div className="mt-4 space-y-1">
          <Label htmlFor={`reason-${courseId}`}>Motif (optionnel)</Label>
          <Input
            id={`reason-${courseId}`}
            placeholder="Ex. examen, stage…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {errorMessage ? (
          <p className="mt-3 text-sm text-danger">{errorMessage}</p>
        ) : null}
      </Modal>
    </>
  );
}
