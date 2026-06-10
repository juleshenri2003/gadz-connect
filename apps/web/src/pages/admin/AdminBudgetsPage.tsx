import { StatCard } from "@/features/admin/StatCard";
import { formatEuro } from "@/features/admin/format";
import { useAdminDashboard } from "@/features/admin/useAdmin";

export function AdminBudgetsPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();

  if (isLoading || !dashboard) {
    return <p className="text-sm text-slate-500">Chargement des budgets…</p>;
  }

  const { budgets, transactions } = dashboard;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Budgets & transactions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Agrégats calculés depuis la table <code>transactions</code> en base Supabase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="indigo"
          label="Volume brut total"
          value={formatEuro(budgets.volumeBrut)}
        />
        <StatCard
          label="Commissions SASU"
          value={formatEuro(budgets.volumeCommissions)}
        />
        <StatCard
          label="Cotisations URSSAF"
          value={formatEuro(budgets.volumeUrssaf)}
        />
        <StatCard
          accent="green"
          label="Net versé (cumul)"
          value={formatEuro(budgets.volumeNetVerse)}
          hint={`Encaissé confirmé : ${formatEuro(budgets.encaisseNet)}`}
        />
        <StatCard
          accent="amber"
          label="En attente de paiement"
          value={formatEuro(budgets.enAttenteBrut)}
        />
        <StatCard
          label="Encaissements bruts"
          value={formatEuro(budgets.encaisseBrut)}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold">Transactions par statut Stripe</h3>
        {transactions.total === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Aucune transaction en base. Des données de démo peuvent être ajoutées via{" "}
            <code>supabase/scripts/seed_dev_demo.sql</code>.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(transactions.byStripeStatus).map(([status, count]) => (
              <li
                key={status}
                className="flex justify-between rounded-lg bg-slate-50 px-4 py-2"
              >
                <span className="capitalize">{status}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
