import { Button } from "@gadz-connect/ui";
import {
  useCreateStripeConnectAccount,
  useStripeConnectStatus,
  useStripeOnboardingLink,
} from "./useStripeConnect";

export function StripeConnectPanel() {
  const { data: status, isLoading } = useStripeConnectStatus();
  const createAccount = useCreateStripeConnectAccount();
  const onboardingLink = useStripeOnboardingLink();

  async function handleStartOnboarding() {
    let accountId = status?.accountId;

    if (!accountId) {
      accountId = await createAccount.mutateAsync();
    }

    const url = await onboardingLink.mutateAsync(accountId);
    window.location.href = url;
  }

  const busy =
    createAccount.isPending || onboardingLink.isPending || isLoading;

  if (status?.onboardingComplete) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        Compte Stripe Connect actif — virements activés.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <p className="text-sm font-medium">Paiements — Stripe Connect Express</p>
      <p className="text-xs text-slate-500">
        Créez votre compte prestataire pour recevoir les virements après chaque
        cours validé.
      </p>
      <Button
        type="button"
        onClick={() => void handleStartOnboarding()}
        disabled={busy}
      >
        {status?.hasAccount
          ? "Reprendre l'onboarding Stripe"
          : "Configurer Stripe Connect"}
      </Button>
      {(createAccount.error || onboardingLink.error) && (
        <p className="text-xs text-red-600">
          {(createAccount.error ?? onboardingLink.error)?.message}
        </p>
      )}
    </div>
  );
}
