import { SequentialTaskBanner } from "./SequentialTaskBanner";
import { useAdminPilotageTasks } from "./useAdminPilotageTasks";

export function AdminTaskBanner() {
  const { tasks, isLoading } = useAdminPilotageTasks();

  if (isLoading) {
    return (
      <div className="mb-6 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-400">
        Chargement du pilotage…
      </div>
    );
  }

  return (
    <SequentialTaskBanner
      scope="admin-pilotage"
      tasks={tasks}
      title="Pilotage RH — actions prioritaires"
      subtitle="Traitez les validations SIRET, alertes et dossiers suspendus dans l'ordre"
      sequential
    />
  );
}
