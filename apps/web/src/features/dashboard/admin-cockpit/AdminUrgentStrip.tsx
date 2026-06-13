import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import type { DashboardTask } from "@/features/dashboard/dashboardTypes";
import { useAdminPilotageTasks } from "@/features/dashboard/useAdminPilotageTasks";

function UrgentTaskItem({ task }: { task: DashboardTask }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-ink-900">{task.title}</p>
        {task.description ? (
          <p className="mt-0.5 text-ink-600">{task.description}</p>
        ) : null}
      </div>
      {task.href ? (
        <Button size="sm" variant="outline" asChild>
          <Link to={task.href}>Traiter →</Link>
        </Button>
      ) : null}
    </li>
  );
}

export function AdminUrgentStrip() {
  const { tasks, isLoading } = useAdminPilotageTasks();

  if (isLoading) {
    return (
      <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-400">
        Chargement des actions prioritaires…
      </div>
    );
  }

  const urgentTasks = tasks.filter((task) => task.status === "todo");
  const allClear = urgentTasks.length === 0;

  if (allClear) {
    const doneTask = tasks.find((task) => task.status === "done");
    return (
      <section className="rounded-md border border-success/20 bg-success-bg/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-success">
          Pilotage à jour
        </p>
        <p className="mt-2 text-sm text-success">
          {doneTask?.description ?? "Aucune action urgente pour le moment."}
        </p>
      </section>
    );
  }

  const visible = urgentTasks.slice(0, 3);

  return (
    <section className="rounded-md border border-warning/20 bg-warning-bg/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-warning">
          À traiter
        </p>
        {urgentTasks.length > 3 ? (
          <Button size="sm" variant="ghost" className="h-auto px-2 py-1" asChild>
            <Link to="/admin/alertes">Voir tout ({urgentTasks.length}) →</Link>
          </Button>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {visible.map((task) => (
          <UrgentTaskItem key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
