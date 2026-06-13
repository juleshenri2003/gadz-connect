import { Button, cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import type { DashboardProgress } from "@/features/dashboard/dashboardTypes";

interface StudentProfileJourneyCardProps {
  progress: DashboardProgress;
}

export function StudentProfileJourneyCard({
  progress,
}: StudentProfileJourneyCardProps) {
  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Votre parcours Gadz&apos;Connect</h3>
          <p className="mt-1 text-sm text-ink-600">
            {progress.completedCount}/{progress.totalCount} étapes complétées
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/app">Tableau de bord →</Link>
        </Button>
      </div>

      <ul className="mt-4 space-y-2" role="list">
        {progress.tasks.map((task) => {
          const done = task.status === "done";
          return (
            <li key={task.id}>
              <Link
                to={task.href ?? "/app"}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  done
                    ? "border-success/20 bg-success-bg text-success hover:bg-success-bg"
                    : "border-line bg-surface text-ink-600 hover:border-brand-100 hover:bg-brand-50/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done
                      ? "bg-success text-white"
                      : "border border-line text-ink-400",
                  )}
                  aria-hidden
                >
                  {done ? "✓" : "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{task.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    {task.description}
                  </span>
                </span>
                {!done ? (
                  <span className="shrink-0 text-xs font-medium text-brand-600">
                    Continuer →
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
