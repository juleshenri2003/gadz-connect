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
            ? "bg-success text-white"
            : "border border-line bg-surface text-ink-400",
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
      ? "border-success/20 bg-success-bg text-success"
      : task.readOnly
        ? "border-warning/20 bg-warning-bg text-warning"
        : isClickable
          ? "border-brand-100 bg-surface text-ink-900 hover:border-brand-100 hover:bg-brand-50"
          : "border-line bg-surface text-ink-600",
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
      className="rounded-md border border-brand-100 bg-surface-alt border border-line p-4 shadow-surface sm:p-5"
      aria-label="Tâches à accomplir"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-ink-600">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-sm font-medium text-brand-700">
          {progress.isComplete ? (
            <span className="text-success">Parcours terminé ✓</span>
          ) : (
            <>
              {progress.completedCount}/{progress.totalCount} — {progress.percent}
              %
            </>
          )}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progress.isComplete ? "bg-success" : "bg-brand-600",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-ink-400">
        Cliquez sur une étape pour y accéder — vous pouvez les faire dans
        l&apos;ordre de votre choix.
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {progress.tasks.map((task) => (
          <TaskChip key={task.id} task={task} />
        ))}
      </div>

      {showInpiAction ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-100 pt-4">
          <p className="text-xs text-ink-600">
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
            <p className="text-xs text-danger" role="alert">
              {(markInpiSent.error as Error).message}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
