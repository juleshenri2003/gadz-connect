import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import type { AdminDashboardData } from "@/features/admin/types";
import { getRoleStatusCount } from "./adminCockpitUtils";

interface AdminTeachersOnboardingPanelProps {
  dashboard: AdminDashboardData;
}

export function AdminTeachersOnboardingPanel({
  dashboard,
}: AdminTeachersOnboardingPanelProps) {
  const pending = getRoleStatusCount(dashboard, "teacher", "pending_siret");
  const active = getRoleStatusCount(dashboard, "teacher", "active");
  const suspended = getRoleStatusCount(dashboard, "teacher", "suspended");
  const totalTeachers = dashboard.profiles.byRole.teacher ?? 0;
  const stripe = dashboard.stripeAccountsTeachers;
  const { onboarding } = dashboard;

  const funnel = [
    ["En attente SIRET", pending, "bg-warning"],
    ["Validés", active, "bg-success"],
    ["Suspendus", suspended, "bg-ink-400"],
  ] as const;

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Professeurs</h3>
          <p className="mt-1 text-xs text-ink-400">
            Funnel onboarding et comptes Stripe ({totalTeachers} profs)
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/utilisateurs?role=teacher">Utilisateurs →</Link>
        </Button>
      </div>

      <ul className="mt-4 space-y-3">
        {funnel.map(([label, count, color]) => (
          <li key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium tabular-nums">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper">
              <div
                className={`h-full rounded-full ${color}`}
                style={{
                  width: totalTeachers
                    ? `${(count / totalTeachers) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-400">Micro existante</dt>
          <dd className="text-lg font-bold tabular-nums">
            {onboarding.existingSiret}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Nouvelle micro</dt>
          <dd className="text-lg font-bold tabular-nums">{onboarding.newMicro}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Stripe terminé</dt>
          <dd className="text-lg font-bold tabular-nums">
            {stripe.onboardingComplete}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Sans Stripe</dt>
          <dd className="text-lg font-bold tabular-nums">
            {stripe.withoutAccount}
          </dd>
        </div>
      </dl>

      {onboarding.verificationFailed > 0 ? (
        <p className="mt-4 text-xs text-warning">
          {onboarding.verificationFailed} vérification(s) SIRET en échec —{" "}
          <Link
            to="/admin/utilisateurs?filter=verification_failed"
            className="font-medium underline"
          >
            contrôler
          </Link>
        </p>
      ) : null}

      <p className="mt-4 text-[11px] text-ink-400">
        Données Stripe lues depuis la base — pas d&apos;appel live.
      </p>
    </section>
  );
}
