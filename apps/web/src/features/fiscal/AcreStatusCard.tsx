import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  cn,
} from "@gadz-connect/ui";
import { useEffect, useState } from "react";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { useUpdateAcre } from "@/features/auth/useMyProfile";
import {
  formatAcreDate,
  getAcreStatusView,
  type AcreState,
} from "./acreStatus";

const STATE_BADGE: Record<Exclude<AcreState, "none">, string> = {
  active: "border-success/20 bg-success-bg text-success",
  expiring: "border-warning/20 bg-warning-bg text-warning",
  expired: "border-line bg-paper text-ink-600",
};

const STATE_LABEL: Record<Exclude<AcreState, "none">, string> = {
  active: "Active",
  expiring: "Bientôt expirée",
  expired: "Expirée — taux plein",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AcreStatusCardProps {
  profile: MyProfile;
}

export function AcreStatusCard({ profile }: AcreStatusCardProps) {
  const [granted, setGranted] = useState(profile.status_acre);
  const [startDate, setStartDate] = useState(profile.acre_start_date ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useUpdateAcre();

  useEffect(() => {
    setGranted(profile.status_acre);
    setStartDate(profile.acre_start_date ?? "");
  }, [profile.status_acre, profile.acre_start_date]);

  const view = getAcreStatusView(profile.status_acre, profile.acre_start_date);

  const dirty =
    granted !== profile.status_acre ||
    (granted && startDate !== (profile.acre_start_date ?? ""));

  const handleSave = () => {
    setLocalError(null);
    setSaved(false);
    if (granted && !startDate.trim()) {
      setLocalError("Renseignez la date de début de votre ACRE.");
      return;
    }
    mutation.mutate(
      {
        statusAcre: granted,
        acreStartDate: granted ? startDate : null,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setLocalError((err as Error).message),
      },
    );
  };

  return (
    <Card className="border-line">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">ACRE</CardTitle>
          {view.state !== "none" ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                STATE_BADGE[view.state],
              )}
            >
              {STATE_LABEL[view.state]}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-ink-400">
          Réduction de cotisations URSSAF (10,6 % au lieu de 21,1 %) pendant 12
          mois. Vous pouvez la déclarer ou la mettre à jour à tout moment.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {view.state === "active" || view.state === "expiring" ? (
          <p className="text-sm text-ink-600">
            Il vous reste <strong>{view.daysRemaining} jour(s)</strong> — fin le{" "}
            <strong>{formatAcreDate(view.endDate)}</strong>.
          </p>
        ) : view.state === "expired" ? (
          <p className="text-sm text-ink-600">
            Terminée le <strong>{formatAcreDate(view.endDate)}</strong>. Vos
            cours sont calculés au taux plein.
          </p>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0"
            checked={granted}
            onChange={(event) => setGranted(event.target.checked)}
          />
          <span className="text-sm">
            <strong>Je bénéficie de l&apos;ACRE</strong>
            <br />
            <span className="text-ink-400">
              Cochez si l&apos;URSSAF vous a accordé la réduction.
            </span>
          </span>
        </label>

        {granted ? (
          <div className="space-y-1.5">
            <Label htmlFor="acre-start-date" className="text-sm font-medium">
              Date de début de l&apos;ACRE
            </Label>
            <input
              id="acre-start-date"
              type="date"
              max={todayIso()}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {localError ? (
          <p className="text-sm text-danger" role="alert">
            {localError}
          </p>
        ) : null}
        {saved && !dirty ? (
          <p className="text-sm text-success">Statut ACRE enregistré.</p>
        ) : null}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!dirty || mutation.isPending}
        >
          {mutation.isPending ? "Enregistrement…" : "Enregistrer l'ACRE"}
        </Button>
      </CardContent>
    </Card>
  );
}
