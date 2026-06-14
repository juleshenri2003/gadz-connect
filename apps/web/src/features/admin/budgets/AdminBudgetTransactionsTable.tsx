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
          <span className="hidden lg:inline">
            Détail opérationnel — cliquez sur une ligne pour ouvrir le dossier
          </span>
          <span className="lg:hidden">
            Touchez une carte pour ouvrir le dossier
          </span>
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
        <>
          <ul className="mt-4 divide-y divide-line lg:hidden">
            {transactions.map((transaction) => {
              const courseLabel =
                transaction.course.subject ||
                transaction.course.title ||
                "Cours de tutorat";

              return (
                <li key={transaction.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 p-4 text-left active:bg-paper"
                    onClick={() => onOpenTransaction(transaction)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900">{courseLabel}</p>
                        <p className="text-sm text-ink-600">
                          {formatTransactionDate(transaction.created_at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                        {formatEuro(transaction.net_payout)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-2 text-xs text-ink-600">
                      <span>
                        {formatPersonName(transaction.course.provider, "—")}
                      </span>
                      <span aria-hidden>→</span>
                      <span>
                        {formatPersonName(transaction.course.client, "—")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StripeStatusBadge status={transaction.status_stripe} />
                      {transaction.status_stripe === "succeeded" ? (
                        <UrssafStatusBadge status={transaction.status_urssaf} />
                      ) : null}
                      <span className="text-xs text-ink-400">
                        Brut {formatEuro(transaction.amount_gross)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 hidden overflow-x-auto lg:block">
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
        </>
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
