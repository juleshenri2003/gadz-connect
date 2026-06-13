import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { formatFrenchDate } from "./microEnterprisePageUtils";

interface MicroEnterpriseAlertsProps {
  profile: MyProfile;
}

export function MicroEnterpriseAlerts({ profile }: MicroEnterpriseAlertsProps) {
  const inpiDate = formatFrenchDate(profile.inpi_declaration_sent_at);

  return (
    <div className="space-y-3">
      {profile.siret_verification_failed ? (
        <div
          className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <strong>SIRET non reconnu.</strong> Le numéro transmis n&apos;a pas pu
          être vérifié. Contactez l&apos;équipe campus à{" "}
          <a
            href={`mailto:${RH_CONTACT_EMAIL}?subject=SIRET%20Gadz'Connect`}
            className="font-medium underline underline-offset-2"
          >
            {RH_CONTACT_EMAIL}
          </a>{" "}
          pour corriger votre déclaration.
        </div>
      ) : null}

      {inpiDate ? (
        <div
          className="rounded-lg border border-success/20 bg-success-bg px-4 py-3 text-sm text-success"
          role="status"
        >
          Demande INPI confirmée le <strong>{inpiDate}</strong>.
        </div>
      ) : null}
    </div>
  );
}
