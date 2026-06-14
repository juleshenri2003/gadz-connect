import { formatEuro } from "@/features/admin/format";
import type { AdminBudgetCampusFinancialRow } from "@/features/admin/types";
import { AdminBudgetCampusLink } from "./AdminBudgetTransactionsTable";

interface AdminBudgetCampusBreakdownProps {
  rows: AdminBudgetCampusFinancialRow[];
}

export function AdminBudgetCampusBreakdown({
  rows,
}: AdminBudgetCampusBreakdownProps) {
  if (rows.length === 0) return null;

  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div>
        <h3 className="font-semibold text-ink-900">
          Répartition financière par campus
        </h3>
        <p className="mt-1 text-xs text-ink-400">
          Vue inter-campus — encaissements et commissions sur la période
        </p>
      </div>

      <ul className="mt-4 divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.campusId} className="py-4 first:pt-0">
            <p className="font-medium text-ink-900">
              <AdminBudgetCampusLink
                campusId={row.campusId}
                campusName={row.name}
              />
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-ink-400">Encaissé net</dt>
                <dd className="font-medium tabular-nums">
                  {formatEuro(row.encaisseNet)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">En attente</dt>
                <dd className="tabular-nums">{formatEuro(row.enAttenteBrut)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Commissions</dt>
                <dd className="tabular-nums">{formatEuro(row.commission)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Transactions</dt>
                <dd className="tabular-nums">{row.transactionCount}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b bg-paper text-ink-600">
            <tr>
              <th className="px-3 py-2 font-medium">Campus</th>
              <th className="px-3 py-2 font-medium text-right">Encaissé net</th>
              <th className="px-3 py-2 font-medium text-right">En attente (brut)</th>
              <th className="px-3 py-2 font-medium text-right">Commissions</th>
              <th className="px-3 py-2 font-medium text-right">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.campusId} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">
                  <AdminBudgetCampusLink
                    campusId={row.campusId}
                    campusName={row.name}
                  />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatEuro(row.encaisseNet)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatEuro(row.enAttenteBrut)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatEuro(row.commission)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {row.transactionCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
