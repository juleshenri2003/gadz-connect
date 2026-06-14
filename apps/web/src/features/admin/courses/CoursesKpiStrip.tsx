import { cn } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import type { AdminCoursePreset } from "@/features/admin/types";
import type { AdminCoursesSummary } from "@/features/admin/types";
import { PRESET_FILTER_LABELS } from "./courseFilters";

interface CoursesKpiStripProps {
  summary: AdminCoursesSummary | undefined;
  loading?: boolean;
  activePreset: AdminCoursePreset | null;
  onPresetChange: (preset: AdminCoursePreset | null) => void;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-md border border-line bg-paper"
        />
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "indigo" | "green" | "amber" | "slate";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md text-left transition ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600",
        active && "ring-2 ring-accent-600",
      )}
    >
      <StatCard label={label} value={value} hint={hint} accent={accent} />
    </button>
  );
}

export function CoursesKpiStrip({
  summary,
  loading,
  activePreset,
  onPresetChange,
}: CoursesKpiStripProps) {
  if (loading || !summary) {
    return <KpiSkeleton />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label="Total sessions"
        value={summary.total}
        accent="indigo"
        active={activePreset === null}
        onClick={() => onPresetChange(null)}
      />
      <KpiCard
        label="Cette semaine"
        value={summary.thisWeekScheduled}
        accent="green"
        hint="Planifiées"
        active={activePreset === "this_week"}
        onClick={() =>
          onPresetChange(activePreset === "this_week" ? null : "this_week")
        }
      />
      <KpiCard
        label="CR manquants"
        value={summary.missingSummaries}
        accent="amber"
        hint="Sessions passées"
        active={activePreset === "missing_summary"}
        onClick={() =>
          onPresetChange(
            activePreset === "missing_summary" ? null : "missing_summary",
          )
        }
      />
      <KpiCard
        label="Annulées"
        value={summary.cancelled}
        accent="slate"
        active={activePreset === "cancelled"}
        onClick={() =>
          onPresetChange(activePreset === "cancelled" ? null : "cancelled")
        }
      />
    </div>
  );
}
