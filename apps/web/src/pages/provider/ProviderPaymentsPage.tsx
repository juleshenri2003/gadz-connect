import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { TeacherInvoicesList } from "@/features/billing/TeacherInvoicesList";
import { AcreCountdown } from "@/features/fiscal/AcreCountdown";
import { TeacherFinancialSummarySection } from "@/features/dashboard/teacher-cockpit/TeacherFinancialSummary";
import { TeacherTransactionsList } from "@/features/dashboard/teacher-cockpit/TeacherTransactionsList";
import { useTeacherFinancial } from "@/features/dashboard/teacher-cockpit/useTeacherFinancial";
import { useOnboardingGuide } from "@/features/onboarding/guide/OnboardingGuideContext";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { TeacherStripeConnectSection } from "@/features/stripe/TeacherStripeConnectSection";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";

type StripeHeaderStatus = "loading" | "inactive" | "pending" | "active";

function getStripeHeaderStatus(
  loading: boolean,
  stripe:
    | {
        hasAccount: boolean;
        onboardingComplete: boolean;
      }
    | undefined,
): StripeHeaderStatus {
  if (loading) return "loading";
  if (!stripe?.hasAccount) return "inactive";
  if (!stripe.onboardingComplete) return "pending";
  return "active";
}

const STATUS_BADGE: Record<
  Exclude<StripeHeaderStatus, "loading">,
  { label: string; className: string }
> = {
  inactive: {
    label: "Non configuré",
    className: "border-warning/20 bg-warning-bg text-warning",
  },
  pending: {
    label: "En cours",
    className: "border-brand-100 bg-brand-50 text-brand-700",
  },
  active: {
    label: "Actif",
    className: "border-success/20 bg-success-bg text-success",
  },
};

function PaymentsPageHeader({
  stripeStatus,
  onboardingHint,
}: {
  stripeStatus: StripeHeaderStatus;
  onboardingHint?: string;
}) {
  const badge =
    stripeStatus !== "loading" ? STATUS_BADGE[stripeStatus] : null;

  const subtitle =
    stripeStatus === "active"
      ? "Suivez vos encaissements, virements et déclarations URSSAF."
      : "Configurez Stripe Connect pour recevoir vos virements après chaque cours validé.";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-ink-900">Paiements</h2>
        {badge ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        ) : (
          <span className="h-5 w-20 animate-pulse rounded-full bg-paper" />
        )}
      </div>
      <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
      {onboardingHint ? (
        <p className="mt-2 text-xs text-brand-700">{onboardingHint}</p>
      ) : null}
    </div>
  );
}

function PaymentsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-paper" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-paper" />
      </div>
      <div className="h-48 animate-pulse rounded-md border border-line bg-paper" />
    </div>
  );
}

function InactiveAccountBanner({
  accountStatus,
  siret,
  onOpenGuide,
}: {
  accountStatus: string;
  siret?: string | null;
  onOpenGuide: () => void;
}) {
  const isSuspended = accountStatus === "suspended";
  const isPendingSiret = accountStatus === "pending_siret";

  return (
    <div className="space-y-6">
      <PaymentsPageHeader stripeStatus="inactive" />
      <section className="rounded-md border border-warning/20 bg-warning-bg p-6 text-sm text-warning">
        {isSuspended ? (
          <>
            Votre compte est suspendu. Contactez l&apos;équipe RH pour
            réactiver l&apos;accès aux paiements.
          </>
        ) : isPendingSiret ? (
          <>
            Votre compte est en attente de validation RH.
            {siret
              ? " Votre SIRET a été transmis."
              : " Déclarez d'abord votre SIRET dans l'onglet Micro-entreprise."}
          </>
        ) : (
          <>Compte non actif — contactez l&apos;équipe RH.</>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {!isSuspended ? (
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/micro-entreprise">Micro-entreprise →</Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={onOpenGuide}>
            Voir le guide
          </Button>
        </div>
      </section>
    </div>
  );
}

export function ProviderPaymentsPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: stripe, isLoading: stripeLoading } = useStripeConnectStatus();
  const {
    data: financial,
    isLoading: financialLoading,
    isError: financialError,
  } = useTeacherFinancial();
  const { progress } = useProviderProgress();
  const { openGuideAt } = useOnboardingGuide();

  if (profileLoading || !profile) {
    return <PaymentsPageSkeleton />;
  }

  const isActive = profile.account_status === "active";

  if (!isActive) {
    return (
      <InactiveAccountBanner
        accountStatus={profile.account_status}
        siret={profile.siret}
        onOpenGuide={() => openGuideAt("stripe")}
      />
    );
  }

  const stripeHeaderStatus = getStripeHeaderStatus(stripeLoading, stripe);

  const stripeTask = progress?.tasks.find((t) => t.id === "stripe");
  const stripeTaskIndex = progress?.tasks.findIndex((t) => t.id === "stripe") ?? -1;
  const onboardingHint =
    progress &&
    !progress.isComplete &&
    stripeTask?.status !== "done" &&
    stripeTaskIndex >= 0
      ? `Étape ${stripeTaskIndex + 1}/${progress.totalCount} — ${stripeTask?.title ?? "Configurer les paiements"}`
      : undefined;

  const stripeConfigured = Boolean(stripe?.onboardingComplete);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PaymentsPageHeader
          stripeStatus={stripeHeaderStatus}
          onboardingHint={onboardingHint}
        />
        {progress && !progress.isComplete ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openGuideAt("stripe")}
          >
            Voir le guide
          </Button>
        ) : null}
      </div>

      <TeacherStripeConnectSection />

      <div className="space-y-4">
        <AcreCountdown profile={profile} />
        <TeacherFinancialSummarySection
          financial={financial}
          isLoading={financialLoading}
          isError={financialError}
          stripeConfigured={stripeConfigured}
        />
        {stripeConfigured ? (
          <TeacherTransactionsList limit={15} id="transactions" />
        ) : null}
        <TeacherInvoicesList />
      </div>
    </div>
  );
}
