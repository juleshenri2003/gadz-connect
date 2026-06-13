import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { AdminTransactionRow } from "@/features/admin/types";
import {
  StripeStatusBadge,
  UrssafStatusBadge,
} from "./AdminBudgetStatusBadges";
import { formatPersonName, formatTransactionDate } from "./adminBudgetLabels";

interface AdminBudgetTransactionsTableProps {
  transactions: AdminTransactionRow[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onOpenTransaction: (transaction: AdminTransactionRow) => void;
}

export function AdminBudgetTransactionsTable({
  transactions,
  isLoading,
  isError,
  errorMessage,
  onOpenTransaction,
}: AdminBudgetTransactionsTableProps) {
  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div>
        <h3 className="font-semibold text-ink-900">Transactions</h3>
        <p className="mt-1 text-xs text-ink-400">
          Détail opérationnel — cliquez sur une ligne pour ouvrir le dossier
        </p>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-ink-400">Chargement des transactions…</p>
      ) : isError ? (
        <p className="mt-4 text-sm text-danger">
          {errorMessage ?? "Impossible de charger les transactions."}
        </p>
      ) : transactions.length === 0 ? (
        <p className="mt-4 text-sm text-ink-600">
          Aucune transaction sur la période sélectionnée. Les paiements
          apparaissent ici dès qu&apos;un élève réserve un créneau.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b bg-paper text-ink-600">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Cours</th>
                <th className="px-3 py-2 font-medium">Prof</th>
                <th className="px-3 py-2 font-medium">Élève</th>
                <th className="px-3 py-2 font-medium">Campus</th>
                <th className="px-3 py-2 font-medium text-right">Brut</th>
                <th className="px-3 py-2 font-medium text-right">Net</th>
                <th className="px-3 py-2 font-medium">Stripe</th>
                <th className="px-3 py-2 font-medium">URSSAF</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const courseLabel =
                  transaction.course.subject ||
                  transaction.course.title ||
                  "Cours de tutorat";

                return (
                  <tr
                    key={transaction.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-paper"
                    onClick={() => onOpenTransaction(transaction)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-ink-600">
                      {formatTransactionDate(transaction.created_at)}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink-900">
                      {courseLabel}
                    </td>
                    <td className="px-3 py-2 text-ink-600">
                      {formatPersonName(transaction.course.provider, "—")}
                    </td>
                    <td className="px-3 py-2 text-ink-600">
                      {formatPersonName(transaction.course.client, "—")}
                    </td>
                    <td className="px-3 py-2 text-ink-600">
                      {transaction.course.campus?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatEuro(transaction.amount_gross)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatEuro(transaction.net_payout)}
                    </td>
                    <td className="px-3 py-2">
                      <StripeStatusBadge status={transaction.status_stripe} />
                    </td>
                    <td className="px-3 py-2">
                      {transaction.status_stripe === "succeeded" ? (
                        <UrssafStatusBadge status={transaction.status_urssaf} />
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AdminBudgetCampusLink({
  campusId,
  campusName,
}: {
  campusId: string;
  campusName: string;
}) {
  return (
    <Link
      to={`/admin/budgets?campus_id=${encodeURIComponent(campusId)}`}
      className="text-brand-700 hover:underline"
    >
      {campusName}
    </Link>
  );
}
