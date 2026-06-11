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
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500",
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
                  isDone ? "text-green-900" : "text-slate-900",
                )}
              >
                {task.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
            </div>
            {isClickable ? (
              <span className="shrink-0 text-xs font-medium text-indigo-600">
                Accéder →
              </span>
            ) : null}
          </>
        );

        const className = cn(
          "flex items-start gap-3 rounded-lg border px-4 py-3",
          isDone
            ? "border-green-100 bg-green-50/30"
            : task.readOnly
              ? "border-amber-100 bg-amber-50/40"
              : "border-slate-200 bg-white",
          isClickable && "hover:border-indigo-200 hover:bg-indigo-50/30",
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
