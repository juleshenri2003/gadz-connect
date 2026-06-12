import type { ReactNode } from "react";
import { TaskProgressBanner } from "@/features/dashboard/TaskProgressBanner";
import { OnboardingTaskList } from "./OnboardingTaskList";
import { useTeacherOnboardingProgress } from "./useTeacherOnboardingProgress";

interface TeacherOnboardingDashboardProps {
  children?: ReactNode;
}

export function TeacherOnboardingDashboard({
  children,
}: TeacherOnboardingDashboardProps) {
  const { progress, profile, isLoading, isError } =
    useTeacherOnboardingProgress();

  if (isLoading) {
    return (
      <p className="text-sm text-slate-500">Chargement de votre parcours…</p>
    );
  }

  if (isError || !progress || !profile) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger votre parcours d&apos;onboarding
      </p>
    );
  }

  const isPendingRh = profile.account_status === "pending_siret";

  return (
    <div className="space-y-8">
      {isPendingRh ? (
        <TaskProgressBanner
          progress={progress}
          title="Mon parcours prestataire"
          subtitle={
            profile.campus?.name
              ? `Campus ${profile.campus.name} — complétez les étapes en attendant la validation RH`
              : "Complétez les étapes en attendant la validation RH"
          }
        />
      ) : null}

      {children}

      {!progress.isComplete ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Détail des étapes</h3>
          <p className="mt-1 text-sm text-slate-500">
            Chaque étape se valide automatiquement lorsque les informations
            sont enregistrées.
          </p>
          <div className="mt-4">
            <OnboardingTaskList tasks={progress.tasks} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
