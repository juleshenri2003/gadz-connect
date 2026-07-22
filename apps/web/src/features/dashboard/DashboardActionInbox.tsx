import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import type { DashboardTask, DashboardTaskKind } from "./dashboardTypes";

interface DashboardActionInboxProps {
  tasks: DashboardTask[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  maxItems?: number;
  /** Ouvre le détail cours (confirmations inline). */
  onOpenCourse?: (courseId: string) => void;
  /** Masque complètement la section s'il n'y a rien à faire. */
  hideWhenEmpty?: boolean;
}

const KIND_ORDER: DashboardTaskKind[] = [
  "confirm",
  "document",
  "payment",
  "onboarding",
  "alert",
  "other",
];

const KIND_META: Record<
  DashboardTaskKind,
  { label: string; row: string; badge: string; cta: string }
> = {
  confirm: {
    label: "Confirmations",
    row: "border-l-warning border-warning/30 bg-warning-bg/40",
    badge: "bg-warning-bg text-warning",
    cta: "Confirmer",
  },
  document: {
    label: "Documents",
    row: "border-l-amber-500 border-amber-200 bg-amber-50/60",
    badge: "bg-amber-100 text-amber-900",
    cta: "Déposer",
  },
  payment: {
    label: "Paiements",
    row: "border-l-violet-500 border-violet-200 bg-violet-50/60",
    badge: "bg-violet-100 text-violet-900",
    cta: "Traiter",
  },
  onboarding: {
    label: "Profil",
    row: "border-l-brand-500 border-brand-200 bg-brand-50/40",
    badge: "bg-brand-100 text-brand-700",
    cta: "Continuer",
  },
  alert: {
    label: "Alertes",
    row: "border-l-orange-500 border-orange-200 bg-orange-50/50",
    badge: "bg-orange-100 text-orange-900",
    cta: "Voir",
  },
  other: {
    label: "À faire",
    row: "border-l-ink-300 border-line bg-surface",
    badge: "bg-paper text-ink-700",
    cta: "Traiter",
  },
};

function taskKind(task: DashboardTask): DashboardTaskKind {
  return task.kind ?? "other";
}

function groupTodos(todos: DashboardTask[]): {
  kind: DashboardTaskKind;
  items: DashboardTask[];
}[] {
  const byKind = new Map<DashboardTaskKind, DashboardTask[]>();
  for (const task of todos) {
    const kind = taskKind(task);
    const list = byKind.get(kind) ?? [];
    list.push(task);
    byKind.set(kind, list);
  }
  return KIND_ORDER.filter((k) => byKind.has(k)).map((kind) => ({
    kind,
    items: byKind.get(kind)!,
  }));
}

function TaskCta({
  task,
  onOpenCourse,
}: {
  task: DashboardTask;
  onOpenCourse?: (courseId: string) => void;
}) {
  const meta = KIND_META[taskKind(task)];
  const label = `${meta.cta} →`;

  if (task.openCourse && task.courseId && onOpenCourse) {
    return (
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => onOpenCourse(task.courseId!)}
      >
        {label}
      </Button>
    );
  }

  if (!task.href) return null;

  if (task.href.startsWith("http")) {
    return (
      <Button size="sm" variant="outline" asChild>
        <a href={task.href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" asChild>
      <Link to={task.href}>{label}</Link>
    </Button>
  );
}

export function DashboardActionInbox({
  tasks,
  isLoading = false,
  title = "À faire",
  subtitle = "Actions prioritaires pour aujourd'hui",
  emptyMessage = "Rien à traiter — vous êtes à jour.",
  maxItems = 6,
  onOpenCourse,
  hideWhenEmpty = false,
}: DashboardActionInboxProps) {
  const todos = tasks.filter((t) => t.status === "todo").slice(0, maxItems);
  const groups = groupTodos(todos);
  const multiGroup = groups.length > 1;

  if (isLoading) {
    return (
      <section className="rounded-md border border-line bg-surface p-4">
        <p className="text-sm text-ink-400">Chargement des actions…</p>
      </section>
    );
  }

  if (todos.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <p className="text-sm text-ink-500">
        <span className="font-medium text-ink-700">{title}</span>
        {" — "}
        {emptyMessage}
      </p>
    );
  }

  return (
    <section className="rounded-md border border-warning/25 bg-warning-bg/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>
        </div>
        <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
          {todos.length}
        </span>
      </div>

      <div className="mt-3 space-y-4">
        {groups.map(({ kind, items }) => {
          const meta = KIND_META[kind];
          return (
            <div key={kind}>
              {multiGroup ? (
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      meta.badge,
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-ink-400">{items.length}</span>
                </div>
              ) : null}
              <ul className="space-y-2">
                {items.map((task) => (
                  <li
                    key={task.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-l-4 px-4 py-3 text-sm",
                      KIND_META[taskKind(task)].row,
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{task.title}</p>
                      {task.description ? (
                        <p className="mt-0.5 text-ink-600">{task.description}</p>
                      ) : null}
                    </div>
                    <TaskCta task={task} onOpenCourse={onOpenCourse} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
