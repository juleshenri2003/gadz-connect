import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROLE_LABELS } from "@/features/admin/format";
import {
  applyNavBadges,
  computeNavBadgeCounts,
} from "@/features/dashboard/navBadgeCounts";
import { useStudentActionTasks } from "@/features/dashboard/useStudentActionTasks";
import { useTeacherActionTasks } from "@/features/dashboard/useTeacherActionTasks";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { GuideModal } from "@/features/onboarding/guide/GuideModal";
import { OnboardingGuideProvider } from "@/features/onboarding/guide/OnboardingGuideContext";
import { GuideTriggerButton } from "@/features/onboarding/guide/GuideTriggerButton";
import { AppShell } from "@/features/layout/AppShell";
import { buildStudentNav, buildTutorNav } from "./providerNav";

export function ProviderLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, progress, isStudentRole } = useProviderProgress();
  const studentTasks = useStudentActionTasks();
  const teacherTasks = useTeacherActionTasks();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const role = profile?.role;
  const student = isStudentRole;

  let nav;
  if (student) {
    const studentLabel = progress?.isComplete
      ? undefined
      : progress
        ? `${progress.completedCount}/${progress.totalCount}`
        : undefined;
    const baseNav = buildStudentNav(studentLabel);
    const badgeCounts = computeNavBadgeCounts(
      studentTasks.tasks,
      baseNav.map((item) => item.to),
    );
    nav = applyNavBadges(baseNav, badgeCounts);
  } else if (profile) {
    const isPendingRh = profile.account_status === "pending_siret";
    const progressLabel =
      isPendingRh && progress && !progress.isComplete
        ? `${progress.completedCount}/${progress.totalCount}`
        : undefined;
    const baseNav = buildTutorNav(progressLabel);

    if (isPendingRh) {
      nav = baseNav;
    } else {
      const badgeCounts = computeNavBadgeCounts(
        teacherTasks.tasks,
        baseNav.map((item) => item.to),
      );
      nav = applyNavBadges(baseNav, badgeCounts);
    }
  } else {
    nav = buildTutorNav();
  }

  const userName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : undefined;

  return (
    <OnboardingGuideProvider>
      <AppShell
        title={student ? "Espace élèves" : "Espace prof"}
        subtitle={
          student
            ? "Arts et Métiers — tutorat"
            : "Professeur / intervenant"
        }
        userName={userName}
        userRole={role ? ROLE_LABELS[role] : undefined}
        nav={nav}
        spaceVariant={student ? "student" : "teacher"}
        footerLabel="Déconnexion"
        onFooterClick={() => void handleSignOut()}
        headerExtra={student ? <GuideTriggerButton /> : undefined}
      />
      <GuideModal />
    </OnboardingGuideProvider>
  );
}
