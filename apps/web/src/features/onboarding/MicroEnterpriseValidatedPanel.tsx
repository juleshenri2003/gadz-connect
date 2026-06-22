import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { formatSiretDisplay } from "@/features/onboarding/microEnterprisePageUtils";
import { MicroEnterpriseAddressForm } from "@/features/onboarding/MicroEnterpriseAddressForm";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";

interface MicroEnterpriseValidatedPanelProps {
  profile: MyProfile;
  submittedSiret?: string | null;
}

export function MicroEnterpriseValidatedPanel({
  profile,
  submittedSiret,
}: MicroEnterpriseValidatedPanelProps) {
  const { progress } = useProviderProgress();
  const { data: stripe } = useStripeConnectStatus();
  const displaySiret = formatSiretDisplay(submittedSiret ?? profile.siret);
  const nextTask = progress?.tasks.find((t) => t.status !== "done");

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border border-success/20 bg-success-bg p-4 text-sm text-success"
        role="status"
      >
        Statut : <strong>Validé (active)</strong>
        {displaySiret ? (
          <>
            <br />
            SIRET : <strong>{displaySiret}</strong>
          </>
        ) : null}
      </div>

      {!profile.micro_enterprise_address?.trim() ? (
        <div
          className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="status"
        >
          Renseignez votre adresse d&apos;auto-entreprise pour des factures
          conformes (obligatoire avant votre premier cours payé).
        </div>
      ) : null}

      <MicroEnterpriseAddressForm
        existingAddress={profile.micro_enterprise_address}
      />

      {nextTask ? (
        <div
          className="rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-700"
          role="status"
        >
          <p className="font-medium">Prochaine étape : {nextTask.title}</p>
          <p className="mt-0.5 text-brand-700/90">{nextTask.description}</p>
          {nextTask.href ? (
            <Button size="sm" className="mt-3" asChild>
              <Link to={nextTask.href}>Continuer →</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-md border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              Paiements Stripe Connect
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              {stripe?.onboardingComplete
                ? "Compte prestataire configuré — gérez vos encaissements."
                : "Finalisez votre compte prestataire pour recevoir vos virements."}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/paiements">Gérer les paiements →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
