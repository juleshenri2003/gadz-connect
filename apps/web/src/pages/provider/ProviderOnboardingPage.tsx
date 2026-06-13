import { useSearchParams } from "react-router-dom";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { OnboardingMicroEnterpriseForm } from "@/features/onboarding/OnboardingMicroEnterpriseForm";
import { MicroEnterprisePageHeader } from "@/features/onboarding/MicroEnterprisePageHeader";
import type { MicroStep } from "@/features/onboarding/microEnterprisePageUtils";

export function ProviderOnboardingPage() {
  const { data: profile, isLoading } = useMyProfile();
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get("step") as MicroStep | null;
  const isEditMode =
    stepParam === "questionnaire" && searchParams.get("edit") === "1";

  return (
    <div className="w-full space-y-8">
      <MicroEnterprisePageHeader
        profile={profile}
        isLoading={isLoading}
        stepParam={stepParam}
        isEditMode={isEditMode}
      />
      <OnboardingMicroEnterpriseForm />
    </div>
  );
}
