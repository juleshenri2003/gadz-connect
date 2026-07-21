import { Button } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatEuro } from "@/features/admin/format";

export type UrssafAnomalyKind =
  | "pending_payout"
  | "rejected_fallback"
  | "stuck_payment"
  | "awaiting_request"
  | "ok";

export interface UrssafReconciliationRow {
  transactionId: string;
  courseId: string;
  anomaly: UrssafAnomalyKind;
  amountGross: number;
  paymentChannel: string | null;
  urssafPaymentStatus: string | null;
  urssafPaymentRequestId: string | null;
  urssafPaidAt: string | null;
  profPayoutStatus: string | null;
  courseSubject: string | null;
  courseStatus: string | null;
  scheduledAt: string | null;
  campusName: string | null;
  clientName: string | null;
  providerName: string | null;
  createdAt: string;
}

interface UrssafReconciliationData {
  summary: {
    total: number;
    pendingPayout: number;
    rejectedFallback: number;
    stuckPayment: number;
    awaitingRequest: number;
    ok: number;
  };
  rows: UrssafReconciliationRow[];
  anomaliesCount: number;
}

const ANOMALY_LABELS: Record<UrssafAnomalyKind, string> = {
  pending_payout: "Reversement prof bloqué",
  rejected_fallback: "Rejet → repli Stripe",
  stuck_payment: "Statut bloqué (>72 h)",
  awaiting_request: "Demande URSSAF manquante",
  ok: "OK",
};

function anomalyTone(kind: UrssafAnomalyKind): string {
  switch (kind) {
    case "pending_payout":
      return "bg-orange-100 text-orange-900";
    case "rejected_fallback":
      return "bg-warning-bg text-warning";
    case "stuck_payment":
      return "bg-danger/10 text-danger";
    case "awaiting_request":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-paper text-ink-600";
  }
}

function useUrssafReconciliation(anomaliesOnly: boolean) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-urssaf-reconciliation", anomaliesOnly],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const qs = anomaliesOnly ? "?anomaliesOnly=true" : "";
      const res = await apiFetch<{ data: UrssafReconciliationData }>(
        `/api/admin/urssaf/reconciliation${qs}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function AdminUrssafReconciliationHub() {
  const [anomaliesOnly, setAnomaliesOnly] = useState(true);
  const { getAccessToken } = useAuth();
  const { data, isLoading, isError, error, refetch } =
    useUrssafReconciliation(anomaliesOnly);

  const anomalyRows = useMemo(
    () => (data?.rows ?? []).filter((r) => r.anomaly !== "ok"),
    [data?.rows],
  );

  async function handleExport() {
    const token = getAccessToken();
    if (!token) return;
    const qs = anomaliesOnly ? "?anomaliesOnly=true" : "?anomaliesOnly=false";
    const res = await fetch(
      `${API_URL}/api/admin/urssaf/reconciliation/export${qs}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error("Export impossible");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urssaf-rapprochement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4 rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">
            Rapprochement URSSAF (avance immédiate)
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            File d&apos;anomalies : virements reçus sans reversement prof,
            rejets SEPA, demandes bloquées. Les virements URSSAF groupés
            se rapprochent ici cours par cours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAnomaliesOnly((v) => !v)}
          >
            {anomaliesOnly ? "Voir tout" : "Anomalies seulement"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleExport().catch(() => undefined)}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">
          {(error as Error)?.message ?? "Impossible de charger le rapprochement"}
        </p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Anomalies" value={data.anomaliesCount} emphasize />
            <Kpi label="Reversement bloqué" value={data.summary.pendingPayout} />
            <Kpi label="Rejets Stripe" value={data.summary.rejectedFallback} />
            <Kpi label="Bloqués >72 h" value={data.summary.stuckPayment} />
            <Kpi label="Demande manquante" value={data.summary.awaitingRequest} />
          </div>

          {(anomaliesOnly ? anomalyRows : data.rows).length === 0 ? (
            <p className="text-sm text-ink-600">
              {anomaliesOnly
                ? "Aucune anomalie — le rapprochement est à jour."
                : "Aucune transaction avance immédiate pour le moment."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line text-ink-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">Anomalie</th>
                    <th className="px-2 py-2 font-medium">Cours</th>
                    <th className="px-2 py-2 font-medium">Montant</th>
                    <th className="px-2 py-2 font-medium">Statut URSSAF</th>
                    <th className="px-2 py-2 font-medium">Prof</th>
                    <th className="px-2 py-2 font-medium">Payeur</th>
                  </tr>
                </thead>
                <tbody>
                  {(anomaliesOnly ? anomalyRows : data.rows).map((row) => (
                    <tr
                      key={row.transactionId}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="px-2 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${anomalyTone(row.anomaly)}`}
                        >
                          {ANOMALY_LABELS[row.anomaly]}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <p className="font-medium text-ink-900">
                          {row.courseSubject ?? "Cours"}
                        </p>
                        <p className="text-xs text-ink-500">
                          {row.campusName ?? "—"}
                          {row.scheduledAt
                            ? ` · ${new Date(row.scheduledAt).toLocaleDateString("fr-FR")}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {formatEuro(row.amountGross)}
                      </td>
                      <td className="px-2 py-2 text-ink-600">
                        {row.urssafPaymentStatus ?? "—"}
                        {row.profPayoutStatus ? (
                          <span className="block text-xs text-ink-400">
                            paie prof: {row.profPayoutStatus}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">{row.providerName ?? "—"}</td>
                      <td className="px-2 py-2">{row.clientName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function Kpi({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-line px-3 py-2 ${
        emphasize && value > 0 ? "bg-warning-bg/40" : "bg-paper/60"
      }`}
    >
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink-900">
        {value}
      </p>
    </div>
  );
}
