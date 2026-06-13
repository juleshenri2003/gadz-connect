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

      <div className="mt-4 overflow-x-auto">
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
