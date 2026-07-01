import { cn } from "@gadz-connect/ui";
import { CalendarClock } from "lucide-react";
import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  formatAcreDate,
  getAcreStatusView,
  type AcreState,
} from "./acreStatus";

const STATE_STYLES: Record<
  Exclude<AcreState, "none">,
  { badge: string; label: string }
> = {
  active: {
    badge: "border-success/20 bg-success-bg text-success",
    label: "ACRE active",
  },
  expiring: {
    badge: "border-warning/20 bg-warning-bg text-warning",
    label: "ACRE bientôt expirée",
  },
  expired: {
    badge: "border-line bg-paper text-ink-600",
    label: "ACRE expirée",
  },
};

interface AcreCountdownProps {
  profile: MyProfile;
}

export function AcreCountdown({ profile }: AcreCountdownProps) {
  const view = getAcreStatusView(profile.status_acre, profile.acre_start_date);

  if (view.state === "none") return null;

  const style = STATE_STYLES[view.state];

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-ink-400" aria-hidden />
        <h3 className="font-semibold text-ink-900">Votre ACRE</h3>
        <span
          className={cn(
            "ml-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            style.badge,
          )}
        >
          {style.label}
        </span>
      </div>

      {view.state === "expired" ? (
        <p className="mt-3 text-sm text-ink-600">
          Votre période ACRE s&apos;est terminée le{" "}
          <strong>{formatAcreDate(view.endDate)}</strong>. Vos cotisations sont
          désormais calculées au taux plein (21,1 %).
        </p>
      ) : !view.startDate ? (
        <p className="mt-3 text-sm text-ink-600">
          ACRE déclarée sans date de début. Renseignez la date pour suivre les
          jours restants.
        </p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-ink-600">
          <p>
            Il vous reste <strong>{view.daysRemaining} jour(s)</strong> de taux
            réduit (10,6 %).
          </p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">
                Début
              </dt>
              <dd className="font-medium text-ink-900">
                {formatAcreDate(view.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">
                Fin (retour au taux plein)
              </dt>
              <dd className="font-medium text-ink-900">
                {formatAcreDate(view.endDate)}
              </dd>
            </div>
          </dl>
          {view.expiringSoon ? (
            <p className="text-warning">
              Anticipez la hausse : après cette date, l&apos;URSSAF passe de
              10,6 % à 21,1 %.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
