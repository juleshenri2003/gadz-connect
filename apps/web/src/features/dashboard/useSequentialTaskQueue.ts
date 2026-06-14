import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardTask } from "./dashboardTypes";

function storageKey(scope: string, suffix: string) {
  return `gadz-task-queue-${scope}-${suffix}`;
}

function readDismissed(scope: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(scope, "dismissed"));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function readCursor(scope: string): number {
  const raw = localStorage.getItem(storageKey(scope, "cursor"));
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function readCompleteAcknowledged(scope: string): boolean {
  try {
    return localStorage.getItem(storageKey(scope, "complete-ack")) === "1";
  } catch {
    return false;
  }
}

export function useSequentialTaskQueue(scope: string, tasks: DashboardTask[]) {
  const [dismissed, setDismissed] = useState<string[]>(() =>
    readDismissed(scope),
  );
  const [cursor, setCursor] = useState(() => readCursor(scope));
  const [completeAcknowledged, setCompleteAcknowledged] = useState(() =>
    readCompleteAcknowledged(scope),
  );

  const todoTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "todo" && !dismissed.includes(task.id),
      ),
    [tasks, dismissed],
  );

  useEffect(() => {
    setDismissed((prev) => {
      const doneIds = new Set(
        tasks.filter((t) => t.status === "done").map((t) => t.id),
      );
      const next = prev.filter((id) => !doneIds.has(id));
      if (next.length !== prev.length) {
        localStorage.setItem(
          storageKey(scope, "dismissed"),
          JSON.stringify(next),
        );
      }
      return next;
    });
  }, [tasks, scope]);

  useEffect(() => {
    if (cursor >= todoTasks.length) {
      const next = Math.max(0, todoTasks.length - 1);
      setCursor(next);
      localStorage.setItem(storageKey(scope, "cursor"), String(next));
    }
  }, [cursor, todoTasks.length, scope]);

  useEffect(() => {
    if (todoTasks.length > 0 && completeAcknowledged) {
      setCompleteAcknowledged(false);
      localStorage.removeItem(storageKey(scope, "complete-ack"));
    }
  }, [todoTasks.length, completeAcknowledged, scope]);

  const acknowledgeComplete = useCallback(() => {
    setCompleteAcknowledged(true);
    localStorage.setItem(storageKey(scope, "complete-ack"), "1");
  }, [scope]);

  const currentIndex =
    todoTasks.length === 0 ? 0 : Math.min(cursor, todoTasks.length - 1);
  const currentTask = todoTasks[currentIndex] ?? null;

  const completeCurrent = useCallback(() => {
    if (!currentTask) return;
    setDismissed((prev) => {
      const next = [...prev, currentTask.id];
      localStorage.setItem(storageKey(scope, "dismissed"), JSON.stringify(next));
      return next;
    });
    setCursor(0);
    localStorage.setItem(storageKey(scope, "cursor"), "0");
  }, [currentTask, scope]);

  const skipToNext = useCallback(() => {
    if (todoTasks.length <= 1) return;
    const next = (currentIndex + 1) % todoTasks.length;
    setCursor(next);
    localStorage.setItem(storageKey(scope, "cursor"), String(next));
  }, [currentIndex, todoTasks.length, scope]);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const percent =
    totalCount === 0
      ? 100
      : Math.round(
          ((completedCount +
            tasks.filter(
              (t) => t.status === "todo" && dismissed.includes(t.id),
            ).length) /
            totalCount) *
            100,
        );

  return {
    currentTask,
    currentIndex,
    todoTasks,
    totalCount,
    completedCount,
    percent,
    isComplete: todoTasks.length === 0,
    showCompleteBanner: todoTasks.length === 0 && !completeAcknowledged,
    acknowledgeComplete,
    completeCurrent,
    skipToNext,
  };
}
