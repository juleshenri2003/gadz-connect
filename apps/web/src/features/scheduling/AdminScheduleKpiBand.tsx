import { Link } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import type { AdminScheduleSummary } from "@/features/scheduling/types";
import {
  buildAdminAlertHref,
  buildAdminPlanningHref,
} from "@/features/scheduling/adminScheduleUtils";

interface AdminScheduleKpiBandProps {
  summary: AdminScheduleSummary | undefined;
  loading?: boolean;
  campusId?: string;
  isGlobalScope?: boolean;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="indigo"
          label="Sessions sur la période"
          value={summary.totalSessions}
          hint={`${scheduledCount} planifiée${scheduledCount > 1 ? "s" : ""}`}
        />
        <StatCard
          accent="amber"
          label="En attente de remplaçant"
          value={summary.awaitingReplacement}
          hint={
            summary.awaitingReplacement > 0
              ? "Cours à superviser"
              : "Aucun incident"
          }
        />
        <StatCard
          accent="amber"
          label="Remplacements ouverts"
          value={summary.openReplacements}
          hint="Alertes campus actives"
        />
        <StatCard
          label="Comptes-rendus manquants"
          value={summary.missingSummaries}
          hint="Sessions passées sans CR"
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
        {summary.awaitingReplacement > 0 ? (
          <Link
            to={buildAdminPlanningHref({
              campusId,
              status: ["awaiting_replacement"],
            })}
            className="font-medium text-warning underline"
          >
            Filtrer les remplacements →
          </Link>
        ) : null}
        {summary.openReplacements > 0 ? (
          <Link
            to={buildAdminAlertHref()}
            className="font-medium text-brand-700 underline"
          >
            Voir les alertes campus →
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
