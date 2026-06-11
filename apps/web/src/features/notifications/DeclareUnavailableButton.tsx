import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { useDeclareUnavailable } from "./useNotifications";

interface DeclareUnavailableButtonProps {
  courseId: string;
  eventTitle: string;
  courseStatus?: string;
}

export function DeclareUnavailableButton({
  courseId,
  eventTitle,
  courseStatus = "scheduled",
}: DeclareUnavailableButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const declare = useDeclareUnavailable();

  const repairAlerts = courseStatus === "awaiting_replacement";

  async function handleConfirm() {
    try {
      const result = await declare.mutateAsync({
        courseId,
        reason: reason.trim() || undefined,
      });
      setDone(true);
      setOpen(false);
      setReason("");
      alert(
        repairAlerts
          ? `Alertes renvoyées. ${result.recipientsCount} membre(s) ont été notifié(s).`
          : `Indisponibilité déclarée. ${result.recipientsCount} membre(s) du campus ont été notifié(s) pour un remplacement.`,
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (done) {
    return (
      <p className="mt-2 text-[10px] font-medium text-amber-700">
        {repairAlerts
          ? "Alertes campus renvoyées"
          : "Indisponibilité signalée au campus"}
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2 h-7 w-full text-[10px]"
        onClick={() => setOpen(true)}
      >
        {repairAlerts ? "Renvoyer les alertes" : "Je suis indisponible"}
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-amber-200 bg-amber-50/80 p-2">
      <p className="text-[10px] font-medium text-amber-900">
        {repairAlerts
          ? `Les alertes n'ont peut-être pas été envoyées pour « ${eventTitle} ». Les renvoyer à l'élève, aux profs du campus et à l'équipe RH ?`
          : `Signaler votre indisponibilité pour « ${eventTitle} » ? L'élève et les professeurs de votre campus seront alertés pour un remplacement.`}
      </p>
      <div className="space-y-1">
        <Label htmlFor={`reason-${courseId}`} className="text-[10px]">
          Motif (optionnel)
        </Label>
        <Input
          id={`reason-${courseId}`}
          className="h-8 text-xs"
          placeholder="Ex. examen, stage…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-[10px]"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 flex-1 text-[10px]"
          disabled={declare.isPending}
          onClick={() => void handleConfirm()}
        >
          {declare.isPending ? "Envoi…" : "Confirmer"}
        </Button>
      </div>
    </div>
  );
}
