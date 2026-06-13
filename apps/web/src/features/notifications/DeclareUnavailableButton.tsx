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
  const isStudent = audience === "student";

  const repairAlerts = courseStatus === "awaiting_replacement";

  async function handleConfirm() {
    setErrorMessage(null);
    try {
      const result = await declare.mutateAsync({
        courseId,
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      setReason("");
      setSuccessMessage(
        isStudent
          ? "Votre absence est signalée — le cours est annulé et le campus est alerté."
          : repairAlerts
            ? `Alertes renvoyées — ${result.recipientsCount} membre(s) notifié(s).`
            : `Indisponibilité déclarée — ${result.recipientsCount} membre(s) notifié(s) pour un remplacement.`,
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

  const buttonLabel = isStudent
    ? "Je ne peux pas venir"
    : repairAlerts
      ? "Renvoyer les alertes"
      : "Indisponible";

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
        title={
          isStudent
            ? "Signaler que vous ne pouvez pas venir"
            : repairAlerts
              ? "Renvoyer les alertes campus"
              : "Signaler une indisponibilité"
        }
        description={
          isStudent
            ? `Vous ne pourrez pas assister au cours « ${eventTitle} ».`
            : repairAlerts
              ? `Les alertes n'ont peut-être pas été envoyées pour « ${eventTitle} ».`
              : `Vous ne pourrez pas assurer « ${eventTitle} ».`
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={declare.isPending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={declare.isPending}
              onClick={() => void handleConfirm()}
            >
              {declare.isPending ? "Envoi…" : "Confirmer"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          {isStudent
            ? "Le cours sera annulé et les professeurs de votre campus seront alertés. Le créneau sera libéré."
            : repairAlerts
              ? "Les alertes seront renvoyées à l'élève, aux profs du campus et à l'équipe RH."
              : "L'élève et les professeurs de votre campus seront alertés pour un remplacement."}
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
