import type { ReactNode } from "react";
import { ProviderJourneyCard } from "./ProviderJourneyCard";
import { useProviderProgress } from "./useProviderProgress";
import { getJourneySubtitle } from "@/features/onboarding/guide/guideContent";

interface TeacherOnboardingDashboardProps {
  children?: ReactNode;
}

export function TeacherOnboardingDashboard({
  children,
}: TeacherOnboardingDashboardProps) {
  const { progress, profile, registrationPath, isLoading, isError } =
    useProviderProgress();

  if (isLoading) {
    return (
      <p className="text-sm text-ink-400">Chargement de votre parcours…</p>
    );
  }

  if (isError || !progress || !profile || !registrationPath) {
    return (
      <p className="text-sm text-danger">
        Impossible de charger votre parcours d&apos;onboarding
      </p>
    );
  }

  const isPending = profile.account_status === "pending_siret";
  const variant = isPending ? "pending" : "finalize";

  return (
    <div className="space-y-8">
      {!progress.isComplete ? (
        <ProviderJourneyCard
          progress={progress}
          variant={variant}
          registrationPath={registrationPath}
          title="Mon parcours prestataire"
          subtitle={getJourneySubtitle(
            registrationPath,
            profile.account_status,
            profile.campus?.name,
          )}
        />
      ) : null}

      {children}
    </div>
  );
}
