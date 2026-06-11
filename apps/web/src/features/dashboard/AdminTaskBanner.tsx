import { SequentialTaskBanner } from "./SequentialTaskBanner";
import { useAdminPilotageTasks } from "./useAdminPilotageTasks";

export function AdminTaskBanner() {
  const { tasks, isLoading } = useAdminPilotageTasks();

  if (isLoading) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Chargement du pilotage…
      </div>
    );
  }

  return (
    <SequentialTaskBanner
      scope="admin-pilotage"
      tasks={tasks}
      title="Pilotage RH — actions prioritaires"
      subtitle="Traitez les validations, remplacements et alertes campus dans l'ordre"
      sequential
    />
  );
}
