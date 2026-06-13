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
      <div className="rounded-lg border border-success/20 bg-success-bg p-4 text-sm text-success">
        Compte Stripe Connect actif — virements activés.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line p-4 space-y-3">
      <p className="text-sm font-medium">Paiements — Stripe Connect Express</p>
      <p className="text-xs text-ink-400">
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
        <p className="text-xs text-danger">
          {(createAccount.error ?? onboardingLink.error)?.message}
        </p>
      )}
    </div>
  );
}
