import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type { AdminDashboardData } from "@/features/admin/types";

interface AdminPlatformHealthProps {
  dashboard: AdminDashboardData;
}

export function AdminPlatformHealth({ dashboard }: AdminPlatformHealthProps) {
  const { budgets, transactions, marketplace } = dashboard;
  const pendingTx = transactions.byStripeStatus.pending ?? 0;

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Santé plateforme</h3>
          <p className="mt-1 text-xs text-ink-400">
            Finances et visibilité marketplace
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/budgets">Budgets →</Link>
        </Button>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-400">Encaissé net</dt>
          <dd className="font-semibold tabular-nums">
            {formatEuro(budgets.encaisseNet)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-400">En attente de paiement</dt>
          <dd className="font-semibold tabular-nums">
            {formatEuro(budgets.enAttenteBrut)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-400">Transactions pending</dt>
          <dd className="font-semibold tabular-nums">{pendingTx}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-400">Profs réservables</dt>
          <dd className="font-semibold tabular-nums">
            {marketplace.visibleTeachers}
            <span className="ml-1 text-xs font-normal text-ink-400">
              / {marketplace.activeTeachers} actifs
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-400">Avec créneaux publiés</dt>
          <dd className="font-semibold tabular-nums">
            {marketplace.withFutureSlots}
          </dd>
        </div>
      </dl>
    </section>
  );
}
