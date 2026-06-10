import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { StripeConnectPanel } from "@/features/stripe/StripeConnectPanel";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";

export function ProviderPaymentsPage() {
  const { data: profile } = useMyProfile();
  const { data: stripe, isLoading } = useStripeConnectStatus();
  const isActive = profile?.account_status === "active";

  if (profile && !isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Paiements</h2>
          <p className="mt-1 text-sm text-slate-600">
            Stripe Connect sera disponible après validation de votre compte.
          </p>
        </div>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {profile.account_status === "pending_siret" ? (
            <>
              Votre compte est en attente de validation RH.
              {profile.siret
                ? " Votre SIRET a été transmis."
                : " Déclarez d'abord votre SIRET dans l'onglet Micro-entreprise."}
            </>
          ) : (
            <>Compte non actif — contactez l&apos;équipe RH.</>
          )}
          <Button className="mt-4" size="sm" variant="outline" asChild>
            <Link to="/app/micro-entreprise">Micro-entreprise →</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Paiements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configurez Stripe Connect pour recevoir vos virements après chaque
          cours validé.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Stripe Connect Express</h3>
        <p className="mt-2 text-sm text-slate-600">
          Compte prestataire requis pour les paiements inter-campus.
        </p>
        <div className="mt-6">
          <StripeConnectPanel />
        </div>
      </section>

      {!isLoading && stripe ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">État du compte</h3>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Compte créé</dt>
              <dd className="font-medium">{stripe.hasAccount ? "Oui" : "Non"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Onboarding</dt>
              <dd className="font-medium">
                {stripe.onboardingComplete ? "Terminé" : "En cours"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Paiements</dt>
              <dd className="font-medium">
                {stripe.chargesEnabled ? "Activés" : "Désactivés"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Virements</dt>
              <dd className="font-medium">
                {stripe.payoutsEnabled ? "Activés" : "Désactivés"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
