import { Link } from "react-router-dom";
import { StatCard } from "@/features/admin/StatCard";
import { formatEuro } from "@/features/admin/format";
import type { AdminDashboardData } from "@/features/admin/types";
import { getRoleStatusCount } from "./adminCockpitUtils";

interface AdminPilotageStatsRowProps {
  dashboard: AdminDashboardData;
  unreadAlerts: number;
}

export function AdminPilotageStatsRow({
  dashboard,
  unreadAlerts,
}: AdminPilotageStatsRowProps) {
  const teachersActive = getRoleStatusCount(dashboard, "teacher", "active");
  const teachersPending = getRoleStatusCount(
    dashboard,
    "teacher",
    "pending_siret",
  );
  const studentsActive = getRoleStatusCount(
    dashboard,
    "student_provider",
    "active",
  );
  const cancelled = dashboard.courses.byStatus.cancelled ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <Link to="/admin/utilisateurs/profs" className="block transition hover:opacity-90">
        <StatCard
          accent="indigo"
          label="Profs actifs"
          value={teachersActive}
          hint={
            teachersPending > 0
              ? `${teachersPending} en attente SIRET`
              : "Comptes validés"
          }
        />
      </Link>
      <Link
        to="/admin/utilisateurs/profs?filter=pending_siret"
        className="block transition hover:opacity-90"
      >
        <StatCard
          accent="amber"
          label="Profs en attente SIRET"
          value={teachersPending}
          hint={
            dashboard.onboarding.verificationFailed > 0
              ? `${dashboard.onboarding.verificationFailed} vérification(s) en échec`
              : "Onboarding micro-entreprise"
          }
        />
      </Link>
      <Link
        to="/admin/utilisateurs/eleves"
        className="block transition hover:opacity-90"
      >
        <StatCard
          accent="green"
          label="Élèves actifs"
          value={studentsActive}
          hint={`${dashboard.profiles.byRole.student_provider ?? 0} inscrits au total`}
        />
      </Link>
      <Link to="/admin/planning" className="block transition hover:opacity-90">
        <StatCard
          label="Cours cette semaine"
          value={dashboard.courses.thisWeekScheduled}
          hint={`${dashboard.courses.byStatus.scheduled ?? 0} planifiés au total`}
        />
      </Link>
      <Link to="/admin/budgets" className="block transition hover:opacity-90">
        <StatCard
          accent="green"
          label="Volume encaissé"
          value={formatEuro(dashboard.budgets.encaisseNet)}
          hint={
            dashboard.budgets.enAttenteBrut > 0
              ? `${formatEuro(dashboard.budgets.enAttenteBrut)} en attente`
              : `${dashboard.transactions.total} transaction(s)`
          }
        />
      </Link>
      <Link to="/admin/alertes" className="block transition hover:opacity-90">
        <StatCard
          accent="amber"
          label="Alertes non lues"
          value={unreadAlerts}
          hint={
            cancelled > 0
              ? `${cancelled} séance(s) annulée(s)`
              : "Annulations et informations campus"
          }
        />
      </Link>
    </div>
  );
}
