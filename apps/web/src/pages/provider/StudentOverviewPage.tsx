import { StudentCockpit } from "@/features/dashboard/student-cockpit/StudentCockpit";
import { useStudentDashboardProgress } from "@/features/dashboard/useStudentDashboardProgress";

export function StudentOverviewPage() {
  const { profile, events, tutorCount, isLoading, isError } =
    useStudentDashboardProgress();

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-danger">Impossible de charger votre profil</p>
    );
  }

  return (
    <StudentCockpit
      profile={profile}
      events={events}
      tutorCount={tutorCount}
    />
  );
}
