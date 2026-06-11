import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { AdminTaskBanner } from "@/features/dashboard/AdminTaskBanner";
import { StatCard } from "@/features/admin/StatCard";
import { formatEuro } from "@/features/admin/format";
import { useAdminDashboard } from "@/features/admin/useAdmin";

export function AdminOverviewPage() {
  const { data: dashboard, isLoading, isError, error } = useAdminDashboard();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement du tableau de bord…</p>;
  }

  if (isError || !dashboard) {
    return (
      <p className="text-sm text-red-600">
        {(error as Error)?.message ?? "Impossible de charger le tableau de bord"}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <AdminTaskBanner />

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h2>
        <p className="mt-1 text-sm text-slate-600">
          {dashboard.scope === "global"
            ? "Tous les campus Arts et Métiers"
            : "Périmètre limité à votre campus"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="indigo"
          label="Membres"
          value={dashboard.profiles.total}
          hint={`${dashboard.profiles.byStatus.pending_siret} en attente SIRET`}
        />
        <StatCard
          accent="green"
          label="Comptes validés"
          value={dashboard.profiles.byStatus.active}
        />
        <StatCard
          label="Cours"
          value={dashboard.courses.total}
          hint={`${dashboard.courses.byStatus.scheduled ?? 0} planifiés`}
        />
        <StatCard
          accent="amber"
          label="Transactions"
          value={dashboard.transactions.total}
          hint={`${formatEuro(dashboard.budgets.volumeBrut)} de volume brut`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Répartition des statuts</h3>
          <ul className="mt-4 space-y-3">
            {(
              [
                ["En attente SIRET", dashboard.profiles.byStatus.pending_siret, "bg-amber-400"],
                ["Validés", dashboard.profiles.byStatus.active, "bg-green-500"],
                ["Suspendus", dashboard.profiles.byStatus.suspended, "bg-slate-400"],
              ] as const
            ).map(([label, count, color]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                      width: dashboard.profiles.total
                        ? `${(count / dashboard.profiles.total) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-6" size="sm" asChild>
            <Link to="/admin/membres">Gérer les membres →</Link>
          </Button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Comptes paiement (base)</h3>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Comptes renseignés</dt>
              <dd className="text-xl font-bold tabular-nums">
                {dashboard.stripeAccounts.withAccount}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Onboarding terminé</dt>
              <dd className="text-xl font-bold tabular-nums">
                {dashboard.stripeAccounts.onboardingComplete}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">En cours</dt>
              <dd className="text-xl font-bold tabular-nums">
                {dashboard.stripeAccounts.pending}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sans compte</dt>
              <dd className="text-xl font-bold tabular-nums">
                {dashboard.stripeAccounts.withoutAccount}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Données lues depuis la table <code>profiles</code> — pas d&apos;appel
            Stripe.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Prochaines étapes</h3>
        <p className="mt-2 text-sm text-slate-600">
          Les interfaces élève et professeur seront reliées ici plus tard. Pour
          l&apos;instant, utilisez cette console pour superviser les inscriptions et
          valider les SIRET.
        </p>
      </section>
    </div>
  );
}
