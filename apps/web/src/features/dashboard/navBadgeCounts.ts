import type { DashboardTask } from "./dashboardTypes";

const HREF_ALIASES: Record<string, string> = {
  "/app/setup": "/app/profil",
  "/app#trouver-un-tuteur": "/app/cours",
};

export function formatNavBadgeCount(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

export function resolveNavPathForTaskHref(
  href: string,
  navPaths: readonly string[],
): string | null {
  if (HREF_ALIASES[href]) {
    return HREF_ALIASES[href];
  }

  const normalized = href.split(/[?#]/)[0] ?? href;
  if (HREF_ALIASES[normalized]) {
    return HREF_ALIASES[normalized];
  }

  if (navPaths.includes(normalized)) {
    return normalized;
  }

  let best: string | null = null;
  for (const navPath of navPaths) {
    if (normalized === navPath || normalized.startsWith(`${navPath}/`)) {
      if (!best || navPath.length > best.length) {
        best = navPath;
      }
    }
  }

  if (!best && href.includes("#trouver")) {
    return navPaths.find((p) => p.endsWith("/cours")) ?? null;
  }

  return best;
}

export function computeNavBadgeCounts(
  tasks: DashboardTask[],
  navPaths: readonly string[],
): Record<string, number> {
  const counts = Object.fromEntries(navPaths.map((p) => [p, 0]));

  for (const task of tasks) {
    if (task.status !== "todo" || task.readOnly || !task.href) continue;
    const path = resolveNavPathForTaskHref(task.href, navPaths);
    if (path && path in counts) {
      counts[path] += 1;
    }
  }

  return counts;
}

export function applyNavBadges<T extends { to: string }>(
  items: readonly T[],
  badgeCounts: Record<string, number>,
): (T & { taskCount?: number })[] {
  return items.map((item) => {
    const count = badgeCounts[item.to] ?? 0;
    return count > 0 ? { ...item, taskCount: count } : { ...item };
  });
}
