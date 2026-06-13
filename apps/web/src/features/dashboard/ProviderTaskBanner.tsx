import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { SequentialTaskBanner } from "./SequentialTaskBanner";
import { useStudentActionTasks } from "./useStudentActionTasks";
import { useTeacherActionTasks } from "./useTeacherActionTasks";

export function ProviderTaskBanner() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const studentTasks = useStudentActionTasks();
  const teacherTasks = useTeacherActionTasks();

  if (profileLoading) {
    return (
      <div className="mb-6 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-400">
        Chargement…
      </div>
    );
  }

  if (!profile) return null;

  const student = isStudent(profile.role);

  if (!student && teacherTasks.isPendingRh) {
    return null;
  }

  if (student) {
    if (studentTasks.isLoading) return null;
    return (
      <SequentialTaskBanner
        scope="student-actions"
        tasks={studentTasks.tasks}
        title="À faire — espace élève"
        subtitle="Remplacements, réservations et alertes campus"
        sequential
      />
    );
  }

  if (!teacherTasks.showBanner) return null;
  if (teacherTasks.isLoading) return null;

  return (
    <SequentialTaskBanner
      scope="teacher-actions"
      tasks={teacherTasks.tasks}
      title="À faire — espace prestataire"
      subtitle="Remplacements, URSSAF, paiements et alertes campus"
      sequential
    />
  );
}
