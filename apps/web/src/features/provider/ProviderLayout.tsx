import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROLE_LABELS } from "@/features/admin/format";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { GuideModal } from "@/features/onboarding/guide/GuideModal";
import { OnboardingGuideProvider } from "@/features/onboarding/guide/OnboardingGuideContext";
import { GuideTriggerButton } from "@/features/onboarding/guide/GuideTriggerButton";
import { NotificationNavBadge } from "@/features/notifications/NotificationNavBadge";
import { AppShell } from "@/features/layout/AppShell";
import { buildStudentNav, buildTutorNav } from "./providerNav";

export function ProviderLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, progress, isStudentRole } = useProviderProgress();

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
    nav = buildStudentNav(studentLabel);
  } else if (profile && progress) {
    const progressLabel = progress.isComplete
      ? undefined
      : `${progress.completedCount}/${progress.totalCount}`;
    nav = buildTutorNav(progressLabel);
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
        title={student ? "Espace élèves" : "Espace prestataire"}
        subtitle={
          student
            ? "Arts et Métiers — tutorat"
            : "Professeur / intervenant"
        }
        userName={userName}
        userRole={role ? ROLE_LABELS[role] : undefined}
        nav={nav}
        spaceVariant={student ? "student" : "teacher"}
        headerHint={
          student
            ? "Réservez des cours de tutorat sur votre campus"
            : "Votre espace professionnel — données en temps réel"
        }
        footerLabel="Déconnexion"
        onFooterClick={() => void handleSignOut()}
        headerExtra={
          <>
            {student ? <GuideTriggerButton /> : null}
            <NotificationNavBadge to="/app/alertes" />
          </>
        }
      />
      <GuideModal />
    </OnboardingGuideProvider>
  );
}
