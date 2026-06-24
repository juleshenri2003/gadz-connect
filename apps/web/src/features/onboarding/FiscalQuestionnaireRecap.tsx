import { Button, cn } from "@gadz-connect/ui";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { formatEuro } from "@/features/admin/format";
import {
  breakdownForProfile,
  getFiscalProfileDefinition,
} from "@/features/onboarding/fiscalProfile";
import {
  getActivityLabel,
  getUrssafPeriodicityLabel,
  inferRegistrationStatus,
  REGISTRATION_STATUS_LABELS,
} from "./fiscalLabels";

interface FiscalQuestionnaireRecapProps {
  profile: MyProfile;
  editable?: boolean;
  editHref?: string;
  onEditClick?: () => void;
  compact?: boolean;
}

function BoolPill({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        value
          ? "bg-success-bg text-success"
          : "bg-paper text-ink-600",
      )}
    >
      {value ? "Oui" : "Non"}
    </span>
  );
}

function RecapTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-surface px-4 py-3.5",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-medium leading-snug text-ink-900">
        {value}
      </div>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

function EditButton({
  editable,
  editHref,
  onEditClick,
  compact,
}: Pick<
  FiscalQuestionnaireRecapProps,
  "editable" | "editHref" | "onEditClick" | "compact"
>) {
  if (!editable) return null;

  if (onEditClick) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={onEditClick}
      >
        Modifier
      </Button>
    );
  }

  return (
    <Button variant="outline" size={compact ? "sm" : "default"} asChild>
      <Link to={editHref ?? "/app/micro-entreprise?step=questionnaire&edit=1"}>
        Modifier
      </Link>
    </Button>
  );
}

export function FiscalQuestionnaireRecap({
  profile,
  editable = false,
  editHref = "/app/micro-entreprise?step=questionnaire&edit=1",
  onEditClick,
  compact = false,
}: FiscalQuestionnaireRecapProps) {
  const registrationStatus = inferRegistrationStatus(profile);
  const situationLabel = REGISTRATION_STATUS_LABELS[registrationStatus];
  const activityLabel = getActivityLabel(profile.micro_enterprise_activity);
  const urssafLabel = getUrssafPeriodicityLabel(profile.urssaf_periodicity);
  const isQuarterly = profile.urssaf_periodicity !== "monthly";
  const fiscalProfile = getFiscalProfileDefinition(
    profile.status_acre ?? false,
    profile.versement_liberatoire,
  );
  const exampleAmount =
    profile.hourly_rate && profile.hourly_rate > 0 ? profile.hourly_rate : 40;
  const fiscalBreakdown = breakdownForProfile(
    exampleAmount,
    profile.status_acre ?? false,
    profile.versement_liberatoire,
  );

  if (compact) {
    return (
      <section className="space-y-3 rounded-md border border-line bg-paper/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Questionnaire fiscal
            </p>
            <p className="text-xs text-ink-400">Réponses enregistrées</p>
          </div>
          <EditButton
            editable={editable}
            editHref={editHref}
            onEditClick={onEditClick}
            compact
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3 border-b border-line/80 pb-2">
            <span className="text-ink-400">Situation</span>
            <span className="text-right font-medium text-ink-900">
              {situationLabel}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 border-b border-line/80 pb-2">
            <span className="text-ink-400">Activité</span>
            <span className="text-right font-medium text-ink-900">
              {activityLabel}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 border-b border-line/80 pb-2">
            <span className="text-ink-400">URSSAF</span>
            <span className="text-right font-medium text-ink-900">
              {urssafLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-400">Versement libératoire</span>
            <BoolPill value={profile.versement_liberatoire} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line/80 pt-2">
            <span className="text-ink-400">Profil fiscal</span>
            <span className="text-right font-medium text-ink-900">
              {fiscalProfile.shortLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-400">Net estimé / {formatEuro(exampleAmount)}</span>
            <span className="font-medium tabular-nums text-brand-700">
              {formatEuro(fiscalBreakdown.netPayout)}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-line bg-surface shadow-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-paper/80 px-5 py-4 sm:px-6">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink-900">
              Questionnaire fiscal
            </h3>
            <span className="inline-flex rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
              Enregistré
            </span>
          </div>
          <p className="text-sm text-ink-400">
            Vos choix fiscaux pour l&apos;immatriculation et les déclarations
            URSSAF.
          </p>
        </div>
        <EditButton
          editable={editable}
          editHref={editHref}
          onEditClick={onEditClick}
        />
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="rounded-md border border-brand-100 bg-paper px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Votre situation
          </p>
          <p className="mt-1 text-base font-semibold text-brand-700">
            {situationLabel}
          </p>
        </div>

        <div className="rounded-md border border-brand-100 bg-brand-50/40 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Profil fiscal appliqué
          </p>
          <p className="mt-1 text-base font-semibold text-ink-900">
            {fiscalProfile.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {fiscalProfile.description}
          </p>
          <p className="mt-3 text-sm text-ink-600">
            Sur un cours à{" "}
            <strong>{formatEuro(exampleAmount)}</strong>, net estimé :{" "}
            <strong className="text-brand-700">
              {formatEuro(fiscalBreakdown.netPayout)}
            </strong>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RecapTile
            label="Activité"
            value={activityLabel}
            className="sm:col-span-2"
          />
          <RecapTile
            label="Périodicité URSSAF"
            value={urssafLabel}
            hint={
              isQuarterly
                ? "Recommandé — moins de risque d'oubli qu'en mensuel."
                : undefined
            }
          />
          <RecapTile
            label="Versement libératoire"
            value={<BoolPill value={profile.versement_liberatoire} />}
            hint={
              profile.versement_liberatoire
                ? "Impôt sur le revenu payé avec les cotisations URSSAF."
                : "Impôt sur le revenu déclaré séparément."
            }
          />
          <RecapTile
            label="ACRE"
            value={<BoolPill value={profile.status_acre ?? false} />}
            hint={
              profile.status_acre
                ? "Exonération partielle des cotisations (12 mois)."
                : "Pas de demande ACRE indiquée."
            }
          />
        </div>
      </div>
    </section>
  );
}
