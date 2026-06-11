import { useMyProfile } from "@/features/auth/useMyProfile";
import { useMySlots } from "@/features/marketplace/useTutors";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";
import {
  computeTeacherOnboardingProgress,
  type OnboardingProgress,
} from "./teacherOnboardingTasks";

export function useTeacherOnboardingProgress() {
  const profileQuery = useMyProfile();
  const stripeQuery = useStripeConnectStatus();
  const slotsQuery = useMySlots();

  const isLoading =
    profileQuery.isLoading ||
    slotsQuery.isLoading ||
    (stripeQuery.isLoading && !stripeQuery.isError);

  const stripeStatus = stripeQuery.data ?? {
    onboardingComplete: false,
    hasAccount: false,
  };

  const progress: OnboardingProgress | null =
    profileQuery.data && !isLoading
      ? computeTeacherOnboardingProgress(
          profileQuery.data,
          stripeStatus,
          slotsQuery.data,
        )
      : null;

  return {
    progress,
    profile: profileQuery.data,
    isLoading,
    isError: profileQuery.isError,
  };
}
