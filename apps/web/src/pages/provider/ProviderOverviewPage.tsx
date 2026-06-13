import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { ProviderTaskBanner } from "@/features/dashboard/ProviderTaskBanner";
import { TeacherCockpit } from "@/features/dashboard/teacher-cockpit/TeacherCockpit";
import { TeacherOnboardingDashboard } from "@/features/onboarding/progress/TeacherOnboardingDashboard";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { StudentOverviewPage } from "@/pages/provider/StudentOverviewPage";

function daysSince(dateIso: string): number {
  return Math.floor(
    (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getFutureSlotCount(
  slots: { starts_at: string }[] | undefined,
): number {
  const now = Date.now();
  return (slots ?? []).filter((s) => new Date(s.starts_at).getTime() > now)
    .length;
}

function needsHourlyRate(hourlyRate: number | null | undefined): boolean {
  return hourlyRate == null || hourlyRate <= 0;
}

function TeacherIncompleteBanner() {
  const { profile, progress, stripe, slots } = useProviderProgress();
  if (!profile || !progress || progress.isComplete) return null;

  const messages: string[] = [];
  if (profile.account_status === "active" && !stripe?.onboardingComplete) {
    messages.push(
      "Les élèves ne peuvent pas vous payer — configurez Stripe Connect.",
    );
  }
  if (
    profile.account_status === "active" &&
    (needsHourlyRate(profile.hourly_rate) ||
      getFutureSlotCount(slots) === 0)
  ) {
    messages.push(
      "Vous n'apparaissez pas comme réservable — publiez un tarif et des créneaux.",
    );
  }

  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div
          key={msg}
          className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="status"
        >
          {msg}
        </div>
      ))}
    </div>
  );
}

function TeacherReturnBanner() {
  const { profile, progress } = useProviderProgress();
  if (!profile?.updated_at || !progress || progress.isComplete) return null;
  if (daysSince(profile.updated_at) < 30) return null;

  return (
    <div
      className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700"
      role="status"
    >
      Depuis votre dernière visite, votre parcours prestataire n&apos;est pas
      encore terminé ({progress.completedCount}/{progress.totalCount} étapes).
      Reprenez là où vous en étiez depuis la carte parcours ci-dessus.
    </div>
  );
}

export function ProviderOverviewPage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement du tableau de bord…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-danger">Impossible de charger votre profil</p>
    );
  }

  if (isStudent(profile.role)) {
    return <StudentOverviewPage />;
  }

  return (
    <TeacherOnboardingDashboard>
      <TeacherReturnBanner />
      <TeacherIncompleteBanner />
      <ProviderTaskBanner />
      <TeacherCockpit />
    </TeacherOnboardingDashboard>
  );
}
