import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { ROLE_LABELS } from "@/features/admin/format";
import { computeTeacherOnboardingProgress } from "@/features/onboarding/progress/teacherOnboardingTasks";
import { computeStudentDashboardProgress } from "@/features/dashboard/studentDashboardTasks";
import { useMySlots, useTutors } from "@/features/marketplace/useTutors";
import { NotificationNavBadge } from "@/features/notifications/NotificationNavBadge";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";
import { AppShell, type AppNavItem } from "@/features/layout/AppShell";

function buildStudentNav(progressLabel?: string): AppNavItem[] {
  const overviewLabel = progressLabel
    ? `Tableau de bord (${progressLabel})`
    : "Tableau de bord";

  return [
    { to: "/app", label: overviewLabel, end: true },
    { to: "/app/planning", label: "Emploi du temps" },
    { to: "/app/alertes", label: "Alertes campus" },
    { to: "/app/repertoire", label: "Mon répertoire" },
    { to: "/app/cours", label: "Trouver mon tuteur" },
    { to: "/app/profil", label: "Mon profil" },
  ];
}

function buildTutorNav(progressLabel?: string): AppNavItem[] {
  const overviewLabel = progressLabel
    ? `Tableau de bord (${progressLabel})`
    : "Tableau de bord";

  return [
    { to: "/app", label: overviewLabel, end: true },
    { to: "/app/planning", label: "Emploi du temps" },
    { to: "/app/alertes", label: "Alertes campus" },
    { to: "/app/cours", label: "Mes cours" },
    { to: "/app/micro-entreprise", label: "Micro-entreprise" },
    { to: "/app/paiements", label: "Paiements" },
    { to: "/app/profil", label: "Mon profil" },
  ];
}

export function ProviderLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: stripe } = useStripeConnectStatus();
  const { data: slots } = useMySlots();
  const { data: schedule } = useMySchedule();
  const { data: tutors } = useTutors();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const role = profile?.role;
  const student = role ? isStudent(role) : true;

  let nav: AppNavItem[];
  if (student) {
    const studentProgress = profile
      ? computeStudentDashboardProgress(
          profile,
          schedule?.events,
          tutors?.length ?? 0,
        )
      : null;
    const studentLabel = studentProgress?.isComplete
      ? undefined
      : studentProgress
        ? `${studentProgress.completedCount}/${studentProgress.totalCount}`
        : undefined;
    nav = buildStudentNav(studentLabel);
  } else if (profile) {
    const progress = computeTeacherOnboardingProgress(profile, stripe, slots);
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
      headerHint={
        student
          ? "Réservez des cours de tutorat sur votre campus"
          : "Votre espace professionnel — données en temps réel"
      }
      footerLabel="Déconnexion"
      onFooterClick={() => void handleSignOut()}
      headerExtra={<NotificationNavBadge to="/app/alertes" />}
    />
  );
}
