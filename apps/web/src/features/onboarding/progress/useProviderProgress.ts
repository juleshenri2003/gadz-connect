import { useAuth } from "@/features/auth/AuthProvider";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import type { DashboardProgress } from "@/features/dashboard/dashboardTypes";
import { computeStudentDashboardProgress } from "@/features/dashboard/studentDashboardTasks";
import { useMySlots, useTutors } from "@/features/marketplace/useTutors";
import {
  computeTeacherOnboardingProgress,
  getNextOnboardingHref,
} from "@/features/onboarding/progress/teacherOnboardingTasks";
import { inferRegistrationPath } from "@/features/onboarding/registrationPath";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";
import type { RegistrationPath } from "@gadz-connect/types";

export function useProviderProgress() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError } =
    useMyProfile();
  const { data: stripe, isLoading: stripeLoading, isError: stripeError } =
    useStripeConnectStatus();
  const { data: slots, isLoading: slotsLoading } = useMySlots();
  const { data: schedule, isLoading: scheduleLoading } = useMySchedule();
  const { data: tutors, isLoading: tutorsLoading } = useTutors();

  const studentRole = profile ? isStudent(profile.role) : false;
  const registrationPath: RegistrationPath | null = profile
    ? inferRegistrationPath(profile)
    : null;

  const isLoading =
    profileLoading ||
    slotsLoading ||
    scheduleLoading ||
    tutorsLoading ||
    (stripeLoading && !stripeError);

  let progress: DashboardProgress | null = null;
  if (profile && !isLoading) {
    progress = studentRole
      ? computeStudentDashboardProgress(
          profile,
          schedule?.events,
          tutors?.length ?? 0,
        )
      : computeTeacherOnboardingProgress(profile, stripe, slots, registrationPath ?? undefined);
  }

  const nextHref =
    profile && !studentRole && progress && !progress.isComplete
      ? getNextOnboardingHref(profile, stripe, slots)
      : "/app";

  return {
    profile,
    progress,
    registrationPath,
    isStudentRole: studentRole,
    isLoading,
    isError: profileError,
    stripe,
    slots,
    schedule,
    tutors,
    nextHref,
    userId: user?.id,
  };
}
