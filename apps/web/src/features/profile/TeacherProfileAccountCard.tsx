import { Button, Card, CardContent, CardHeader, CardTitle, cn } from "@gadz-connect/ui";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { STATUS_LABELS } from "@/features/admin/format";
import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  getActivityLabel,
  getUrssafPeriodicityLabel,
} from "@/features/onboarding/fiscalLabels";
import {
  formatSiretDisplay,
  microStatusBadgeClass,
} from "@/features/onboarding/microEnterprisePageUtils";
import {
  inferRegistrationPath,
  REGISTRATION_PATH_LABELS,
} from "@/features/onboarding/registrationPath";
import { ProviderProfileIdentityForm } from "@/features/profile/ProviderProfileIdentityForm";

interface FieldRowProps {
  label: string;
  value: ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{value ?? "—"}</dd>
    </div>
  );
}

interface TeacherProfileAccountCardProps {
  profile: MyProfile;
  email: string | undefined;
}

export function TeacherProfileAccountCard({
  profile,
  email,
}: TeacherProfileAccountCardProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const registrationPath = inferRegistrationPath(profile);
  const siretDisplay = formatSiretDisplay(profile.siret) ?? "Non renseigné";

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-lg">{fullName || email}</CardTitle>
        <p className="text-sm text-ink-400">
          Compte, identité et statut administratif.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <ProviderProfileIdentityForm profile={profile} email={email} />

        <section className="border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-ink-900">
            Statut administratif
          </h3>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <FieldRow label="Statut compte" value={STATUS_LABELS[profile.account_status]} />
            <FieldRow
              label="Parcours"
              value={REGISTRATION_PATH_LABELS[registrationPath]}
            />
            <FieldRow
              label="Profil initial"
              value={profile.profile_setup_complete ? "Complété" : "À finaliser"}
            />
            <FieldRow
              label="Paiements Stripe"
              value={
                profile.stripe_connect_onboarding_complete
                  ? "Configurés"
                  : "À finaliser"
              }
            />
          </dl>
          {!profile.stripe_connect_onboarding_complete ? (
            <Button className="mt-3" size="sm" variant="outline" asChild>
              <Link to="/app/paiements">Configurer les paiements →</Link>
            </Button>
          ) : null}
        </section>

        <details className="group rounded-lg border border-line bg-paper/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink-900">
            Informations micro-entreprise
            <span className="ml-2 text-xs font-normal text-ink-400 group-open:hidden">
              (SIRET, fiscal)
            </span>
          </summary>
          <div className="border-t border-line px-4 pb-4 pt-3">
            <dl className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="SIRET" value={siretDisplay} />
              <FieldRow
                label="Activité"
                value={getActivityLabel(profile.micro_enterprise_activity)}
              />
              <FieldRow
                label="Périodicité URSSAF"
                value={getUrssafPeriodicityLabel(profile.urssaf_periodicity)}
              />
              <FieldRow
                label="Versement libératoire"
                value={profile.versement_liberatoire ? "Oui" : "Non"}
              />
              <FieldRow label="ACRE" value={profile.status_acre ? "Oui" : "Non"} />
            </dl>
            <Button className="mt-4" size="sm" variant="outline" asChild>
              <Link to="/app/micro-entreprise">Gérer ma micro-entreprise →</Link>
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

interface AccountStatusBadgeProps {
  status: MyProfile["account_status"];
}

export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  const variant =
    status === "active"
      ? "success"
      : status === "pending_siret"
        ? "warning"
        : status === "suspended"
          ? "danger"
          : "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        microStatusBadgeClass(variant),
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
