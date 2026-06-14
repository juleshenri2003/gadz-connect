import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { useMarkInpiSent } from "@/features/onboarding/progress/useMarkInpiSent";
import type { DashboardTask } from "./dashboardTypes";
import { useSequentialTaskQueue } from "./useSequentialTaskQueue";

interface SequentialTaskBannerProps {
  scope: string;
  tasks: DashboardTask[];
  title: string;
  subtitle?: string;
  sequential?: boolean;
}

function TaskChip({ task, active }: { task: DashboardTask; active: boolean }) {
  const isDone = task.status === "done";
  const isClickable = Boolean(task.href) && !task.readOnly && !isDone;

  const content = (
    <>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          isDone
            ? "bg-success text-white"
            : active
              ? "bg-brand-600 text-white"
              : "border border-line bg-surface text-ink-400",
        )}
        aria-hidden
      >
        {isDone ? "✓" : active ? "→" : "○"}
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{task.title}</span>
    </>
  );

  const baseClass = cn(
    "flex min-w-[9.5rem] max-w-[14rem] shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
    isDone
      ? "border-success/20 bg-success-bg text-success"
      : active
        ? "border-brand-100 bg-brand-50 text-brand-700 ring-1 ring-brand-100"
        : task.readOnly
          ? "border-warning/20 bg-warning-bg text-warning"
          : isClickable
            ? "border-line bg-surface text-ink-600"
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

export function SequentialTaskBanner({
  scope,
  tasks,
  title,
  subtitle,
  sequential = true,
}: SequentialTaskBannerProps) {
  const markInpiSent = useMarkInpiSent();
  const queue = useSequentialTaskQueue(scope, tasks);
  const { currentTask, todoTasks, isComplete, showCompleteBanner, acknowledgeComplete } =
    queue;

  useEffect(() => {
    if (!showCompleteBanner) return;
    const timer = window.setTimeout(acknowledgeComplete, 3500);
    return () => window.clearTimeout(timer);
  }, [showCompleteBanner, acknowledgeComplete]);

  if (tasks.length === 0) return null;
  if (isComplete && !showCompleteBanner) return null;

  if (showCompleteBanner) {
    return (
      <section className="rounded-md border border-success/20 bg-success-bg px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-success">
          {title} — tout est à jour ✓
        </p>
      </section>
    );
  }

  const showInpiAction =
    currentTask?.manualAction === "inpi_sent" && currentTask.status === "todo";

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
          {queue.completedCount}/{queue.totalCount} — {queue.percent}%
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={queue.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${queue.percent}%` }}
        />
      </div>

      {sequential && currentTask ? (
        <div className="mt-4 rounded-lg border border-brand-100 bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Étape {queue.currentIndex + 1} / {todoTasks.length}
          </p>
          <p className="mt-1 font-semibold text-ink-900">{currentTask.title}</p>
          <p className="mt-1 text-sm text-ink-600">{currentTask.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentTask.href ? (
              <Button size="sm" asChild>
                <Link to={currentTask.href}>Ouvrir</Link>
              </Button>
            ) : null}
            <Button size="sm" variant="default" onClick={queue.completeCurrent}>
              Terminer
            </Button>
            {todoTasks.length > 1 ? (
              <Button size="sm" variant="outline" onClick={queue.skipToNext}>
                Passer à la suivante
              </Button>
            ) : null}
          </div>
          {showInpiAction ? (
            <div className="mt-3 border-t border-line pt-3">
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
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            active={sequential && currentTask?.id === task.id}
          />
        ))}
      </div>
    </section>
  );
}
