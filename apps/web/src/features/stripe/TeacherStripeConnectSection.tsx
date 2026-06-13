import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { BrandLogo } from "@/features/onboarding/guide/brands/BrandLogo";
import {
  useCreateStripeConnectAccount,
  useStripeConnectStatus,
  useStripeDashboardLink,
  useStripeOnboardingLink,
} from "./useStripeConnect";

interface ConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

interface StepDef {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
  hint?: string;
}

function humanizeStripeError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue — réessayez dans quelques instants.";
  if (message.includes("503") || message.toLowerCase().includes("non configuré")) {
    return "Service temporairement indisponible — réessayez plus tard.";
  }
  if (message.toLowerCase().includes("non authentifié")) {
    return "Session expirée — reconnectez-vous.";
  }
  return "Impossible de contacter Stripe — réessayez.";
}

function buildSteps(status: ConnectStatus | undefined): StepDef[] {
  const hasAccount = Boolean(status?.hasAccount);
  const onboardingDone = Boolean(status?.onboardingComplete);
  const chargesOn = Boolean(status?.chargesEnabled);
  const payoutsOn = Boolean(status?.payoutsEnabled);

  return [
    {
      id: "account",
      label: "Compte créé",
      done: hasAccount,
      current: !hasAccount,
      hint: hasAccount ? undefined : "Créez votre compte prestataire Stripe.",
    },
    {
      id: "onboarding",
      label: "Onboarding",
      done: onboardingDone,
      current: hasAccount && !onboardingDone,
      hint:
        hasAccount && !onboardingDone
          ? "Complétez les informations demandées par Stripe."
          : undefined,
    },
    {
      id: "charges",
      label: "Encaissements",
      done: chargesOn,
      current: hasAccount && onboardingDone && !chargesOn,
      hint:
        hasAccount && !chargesOn
          ? "Les encaissements s'activent après validation Stripe."
          : undefined,
    },
    {
      id: "payouts",
      label: "Virements",
      done: payoutsOn,
      current: hasAccount && chargesOn && !payoutsOn,
      hint:
        hasAccount && chargesOn && !payoutsOn
          ? "Les virements s'activent une fois votre IBAN validé."
          : undefined,
    },
  ];
}

function StripeConnectStepper({
  status,
  loading,
}: {
  status: ConnectStatus | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-line bg-paper"
          />
        ))}
      </div>
    );
  }

  const steps = buildSteps(status);

  return (
    <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm",
            step.done
              ? "border-success/20 bg-success-bg"
              : step.current
                ? "border-brand-100 bg-brand-50"
                : "border-line bg-paper",
          )}
        >
          <p
            className={cn(
              "text-xs font-medium",
              step.done
                ? "text-success"
                : step.current
                  ? "text-brand-700"
                  : "text-ink-400",
            )}
          >
            {step.label}
          </p>
          <p
            className={cn(
              "mt-0.5 font-semibold",
              step.done
                ? "text-success"
                : step.current
                  ? "text-brand-700"
                  : "text-ink-600",
            )}
          >
            {step.done ? "OK" : step.current ? "En cours" : "—"}
          </p>
          {step.hint && step.current ? (
            <p className="mt-1 text-[11px] leading-snug text-brand-700/90">
              {step.hint}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

interface TeacherStripeConnectSectionProps {
  showTransactionsAnchor?: boolean;
}

export function TeacherStripeConnectSection({
  showTransactionsAnchor = true,
}: TeacherStripeConnectSectionProps) {
  const { data: status, isLoading, isError, refetch } = useStripeConnectStatus();
  const createAccount = useCreateStripeConnectAccount();
  const onboardingLink = useStripeOnboardingLink();
  const dashboardLink = useStripeDashboardLink();

  async function handleStartOnboarding() {
    let accountId = status?.accountId;

    if (!accountId) {
      accountId = await createAccount.mutateAsync();
    }

    const url = await onboardingLink.mutateAsync(accountId);
    window.location.href = url;
  }

  async function handleOpenDashboard() {
    const url = await dashboardLink.mutateAsync();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const busy =
    createAccount.isPending ||
    onboardingLink.isPending ||
    dashboardLink.isPending ||
    isLoading;

  const mutationError = createAccount.error ?? onboardingLink.error ?? dashboardLink.error;

  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BrandLogo brand="stripe" size="md" className="h-5" decorative />
          <h3 className="mt-3 font-semibold text-ink-900">
            Stripe Connect Express
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Compte prestataire requis pour les paiements inter-campus.
          </p>
        </div>
      </div>

      {isError ? (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          Impossible de charger le statut Stripe.
          <Button
            className="ml-2"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : null}

      <StripeConnectStepper status={status} loading={isLoading} />

      <div className="mt-6">
        {status?.onboardingComplete ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/20 bg-success-bg p-4 text-sm text-success">
              Compte Stripe Connect actif — encaissements et virements OK.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleOpenDashboard()}
              >
                Ouvrir mon espace Stripe
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/app/cours">Publier des créneaux</Link>
              </Button>
              {showTransactionsAnchor ? (
                <Button size="sm" variant="outline" asChild>
                  <a href="#transactions">Voir mes transactions</a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-line p-4 space-y-3">
            <p className="text-sm text-ink-600">
              {status?.hasAccount
                ? "Reprenez l'onboarding pour activer les encaissements et virements."
                : "Créez votre compte prestataire pour recevoir les virements après chaque cours validé."}
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
          </div>
        )}

        {mutationError ? (
          <p className="mt-3 text-xs text-danger">
            {humanizeStripeError(mutationError.message)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
