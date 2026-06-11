import { useMyProfile } from "@/features/auth/useMyProfile";
import { useMySlots } from "@/features/marketplace/useTutors";
import { useNotifications } from "@/features/notifications/useNotifications";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";
import { computeTeacherActionTasks } from "./teacherActionTasks";

function countFutureSlots(slots: { starts_at: string }[] | undefined): number {
  const now = Date.now();
  return (slots ?? []).filter((s) => new Date(s.starts_at).getTime() > now)
    .length;
}

export function useTeacherActionTasks() {
  const profileQuery = useMyProfile();
  const stripeQuery = useStripeConnectStatus();
  const slotsQuery = useMySlots();
  const notificationsQuery = useNotifications();

  const profile = profileQuery.data;
  const progress =
    profile && profile.account_status === "active"
      ? computeTeacherActionTasks(
          profile,
          stripeQuery.data,
          notificationsQuery.data,
          countFutureSlots(slotsQuery.data),
        )
      : {
          tasks: [],
          completedCount: 0,
          totalCount: 0,
          percent: 100,
          isComplete: true,
        };

  const isLoading =
    profileQuery.isLoading ||
    stripeQuery.isLoading ||
    slotsQuery.isLoading ||
    notificationsQuery.isLoading;

  const isPendingRh =
    profile?.role === "teacher" && profile.account_status === "pending_siret";

  return {
    progress,
    tasks: progress.tasks,
    isLoading,
    isPendingRh,
    showBanner: Boolean(profile && !isPendingRh && profile.role === "teacher"),
  };
}
