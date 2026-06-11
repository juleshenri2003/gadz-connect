import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { useMarkInpiSent } from "@/features/onboarding/progress/useMarkInpiSent";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

interface TaskProgressBannerProps {
  progress: DashboardProgress;
  title?: string;
  subtitle?: string;
}

function TaskChip({ task }: { task: DashboardTask }) {
  const isDone = task.status === "done";
  const isClickable = Boolean(task.href) && !task.readOnly && !isDone;

  const content = (
    <>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          isDone
            ? "bg-green-600 text-white"
            : "border border-slate-300 bg-white text-slate-400",
        )}
        aria-hidden
      >
        {isDone ? "✓" : "○"}
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{task.title}</span>
    </>
  );

  const baseClass = cn(
    "flex min-w-[9.5rem] max-w-[14rem] shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
    isDone
      ? "border-green-200 bg-green-50 text-green-900"
      : task.readOnly
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : isClickable
          ? "border-indigo-200 bg-white text-slate-900 hover:border-indigo-400 hover:bg-indigo-50"
          : "border-slate-200 bg-white text-slate-700",
  );

  if (isClickable && task.href) {
    return (
      <Link to={task.href} className={baseClass} title={task.description}>
        {content}
      </Link>
    );
  }

  return (
    <span className={baseClass} title={task.description}>
      {content}
    </span>
  );
}

export function TaskProgressBanner({
  progress,
  title = "À faire",
  subtitle,
}: TaskProgressBannerProps) {
  const markInpiSent = useMarkInpiSent();
  const inpiTask = progress.tasks.find((t) => t.id === "inpi");
  const showInpiAction =
    inpiTask &&
    inpiTask.status === "todo" &&
    inpiTask.manualAction === "inpi_sent";

  return (
    <section
      className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-4 shadow-sm sm:p-5"
      aria-label="Tâches à accomplir"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-sm font-medium text-indigo-700">
          {progress.isComplete ? (
            <span className="text-green-700">Parcours terminé ✓</span>
          ) : (
            <>
              {progress.completedCount}/{progress.totalCount} — {progress.percent}
              %
            </>
          )}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progress.isComplete ? "bg-green-500" : "bg-indigo-600",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Cliquez sur une étape pour y accéder — vous pouvez les faire dans
        l&apos;ordre de votre choix.
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {progress.tasks.map((task) => (
          <TaskChip key={task.id} task={task} />
        ))}
      </div>

      {showInpiAction ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-indigo-100 pt-4">
          <p className="text-xs text-slate-600">
            Après envoi sur le Guichet Unique INPI :
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={markInpiSent.isPending || markInpiSent.isSuccess}
            onClick={() => void markInpiSent.mutate()}
          >
            {markInpiSent.isPending
              ? "Enregistrement…"
              : markInpiSent.isSuccess
                ? "Demande enregistrée ✓"
                : "J'ai envoyé ma demande sur l'INPI"}
          </Button>
          {markInpiSent.isError ? (
            <p className="text-xs text-red-600" role="alert">
              {(markInpiSent.error as Error).message}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
