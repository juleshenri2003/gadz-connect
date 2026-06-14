import { Link } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import type { AdminScheduleSummary } from "@/features/scheduling/types";
import { buildAdminPlanningHref } from "@/features/scheduling/adminScheduleUtils";

interface AdminScheduleKpiBandProps {
  summary: AdminScheduleSummary | undefined;
  loading?: boolean;
  campusId?: string;
  isGlobalScope?: boolean;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-md border border-line bg-paper"
        />
      ))}
    </div>
  );
}

export function AdminScheduleKpiBand({
  summary,
  loading,
  campusId,
  isGlobalScope,
}: AdminScheduleKpiBandProps) {
  if (loading || !summary) {
    return <KpiSkeleton />;
  }

  const scheduledCount = summary.byStatus.scheduled ?? 0;
  const cancelledCount = summary.byStatus.cancelled ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="indigo"
          label="Sessions sur la période"
          value={summary.totalSessions}
          hint={`${scheduledCount} planifiée${scheduledCount > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Comptes-rendus manquants"
          value={summary.missingSummaries}
          hint="Sessions passées sans CR"
        />
        <StatCard
          accent="amber"
          label="Séances annulées"
          value={cancelledCount}
          hint={cancelledCount > 0 ? "Sur la période filtrée" : "Aucune annulation"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {summary.openSlots != null ? (
          <span className="rounded-full border border-success/20 bg-success-bg px-3 py-1 text-success">
            {summary.openSlots} créneau{summary.openSlots > 1 ? "x" : ""} ouvert
            {summary.openSlots > 1 ? "s" : ""} non réservé
            {summary.openSlots > 1 ? "s" : ""}
          </span>
        ) : null}
        {cancelledCount > 0 ? (
          <Link
            to={buildAdminPlanningHref({
              campusId,
              status: ["cancelled"],
              showHistory: true,
            })}
            className="rounded-full border border-line bg-paper px-3 py-1 text-ink-600 hover:bg-paper"
          >
            {cancelledCount} annulé{cancelledCount > 1 ? "s" : ""}
          </Link>
        ) : null}
      </div>

      {isGlobalScope && summary.byCampus.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {summary.byCampus.map((campus) => (
            <Link
              key={campus.campusId}
              to={buildAdminPlanningHref({ campusId: campus.campusId })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition hover:border-brand-100 hover:bg-brand-50",
                campusId === campus.campusId
                  ? "border-brand-100 bg-brand-50 text-brand-700"
                  : "border-line bg-surface text-ink-600",
              )}
            >
              {campus.campusName} · {campus.count}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
