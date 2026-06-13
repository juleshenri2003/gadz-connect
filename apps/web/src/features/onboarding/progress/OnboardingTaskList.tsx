import { Link } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import type { DashboardTask } from "@/features/dashboard/dashboardTypes";

interface OnboardingTaskListProps {
  tasks: DashboardTask[];
}

function StatusIcon({ status }: { status: DashboardTask["status"] }) {
  const isDone = status === "done";

  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        isDone
          ? "bg-success-bg text-success"
          : "bg-paper text-ink-400",
      )}
      aria-hidden
    >
      {isDone ? "✓" : "○"}
    </span>
  );
}

export function OnboardingTaskList({ tasks }: OnboardingTaskListProps) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const isDone = task.status === "done";
        const isClickable = Boolean(task.href) && !task.readOnly && !isDone;

        const row = (
          <>
            <StatusIcon status={task.status} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  isDone ? "text-success" : "text-ink-900",
                )}
              >
                {task.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">{task.description}</p>
            </div>
            {isClickable ? (
              <span className="shrink-0 text-xs font-medium text-brand-600">
                Accéder →
              </span>
            ) : null}
          </>
        );

        const className = cn(
          "flex items-start gap-3 rounded-lg border px-4 py-3",
          isDone
            ? "border-success/20 bg-success-bg/30"
            : task.readOnly
              ? "border-warning/20 bg-warning-bg/40"
              : "border-line bg-surface",
          isClickable && "hover:border-brand-100 hover:bg-brand-50/30",
        );

        return (
          <li key={task.id}>
            {isClickable && task.href ? (
              <Link to={task.href} className={className}>
                {row}
              </Link>
            ) : (
              <div className={className}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
