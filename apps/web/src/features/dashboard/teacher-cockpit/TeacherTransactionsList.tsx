import { cn } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type {
  TransactionStripeStatus,
  TransactionUrssafStatus,
} from "@gadz-connect/types";
import { useTeacherTransactions } from "./useTeacherFinancial";

const STRIPE_STATUS_LABELS: Record<TransactionStripeStatus, string> = {
  pending: "En attente",
  succeeded: "Encaissé",
  failed: "Échoué",
  refunded: "Remboursé",
};

const URSSAF_STATUS_LABELS: Record<TransactionUrssafStatus, string> = {
  pending: "À déclarer",
  declared: "Déclaré",
};

function stripeBadgeClass(status: TransactionStripeStatus): string {
  switch (status) {
    case "succeeded":
      return "border-success/20 bg-success-bg text-success";
    case "pending":
      return "border-warning/20 bg-warning-bg text-warning";
    case "failed":
      return "border-danger/20 bg-danger-bg text-danger";
    default:
      return "border-line bg-paper text-ink-600";
  }
}

function urssafBadgeClass(status: TransactionUrssafStatus): string {
  switch (status) {
    case "declared":
      return "border-success/20 bg-success-bg text-success";
    default:
      return "border-warning/20 bg-warning-bg text-warning";
  }
}

interface TeacherTransactionsListProps {
  limit?: number;
  id?: string;
}

export function TeacherTransactionsList({
  limit = 8,
  id,
}: TeacherTransactionsListProps) {
  const { data: transactions, isLoading, isError } = useTeacherTransactions(limit);

  return (
    <section
      id={id}
      className="rounded-md border border-line bg-surface p-5 scroll-mt-6"
    >
      <h3 className="font-semibold text-ink-900">Dernières transactions</h3>
      <p className="mt-1 text-sm text-ink-600">
        Paiements liés à vos cours de tutorat.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="mt-4 text-sm text-danger">
          Impossible de charger les transactions.
        </p>
      ) : !transactions?.length ? (
        <p className="mt-4 text-sm text-ink-600">
          Aucune transaction pour l&apos;instant. Elles apparaissent ici dès
          qu&apos;un élève réserve un créneau.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {transactions.map((tx) => {
            const courseLabel =
              tx.course.subject || tx.course.title || "Cours de tutorat";
            const client = tx.course.client
              ? `${tx.course.client.first_name} ${tx.course.client.last_name}`.trim()
              : "Élève";
            const date = tx.course.scheduled_at
              ? new Date(tx.course.scheduled_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              : new Date(tx.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                });

            return (
              <li
                key={tx.id}
                className="rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{courseLabel}</p>
                    <p className="mt-0.5 text-ink-600">
                      {client} · {date}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        stripeBadgeClass(tx.status_stripe),
                      )}
                    >
                      {STRIPE_STATUS_LABELS[tx.status_stripe]}
                    </span>
                    {tx.status_stripe === "succeeded" ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                          urssafBadgeClass(tx.status_urssaf),
                        )}
                      >
                        {URSSAF_STATUS_LABELS[tx.status_urssaf]}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-600">
                  <span>Brut {formatEuro(tx.amount_gross)}</span>
                  <span className="font-semibold text-ink-900">
                    Net {formatEuro(tx.net_payout)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
