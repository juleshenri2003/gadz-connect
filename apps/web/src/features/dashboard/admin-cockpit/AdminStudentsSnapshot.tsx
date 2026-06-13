import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import type { AdminDashboardData } from "@/features/admin/types";
import { getRoleStatusCount } from "./adminCockpitUtils";

interface AdminStudentsSnapshotProps {
  dashboard: AdminDashboardData;
  openReplacements: number;
}

export function AdminStudentsSnapshot({
  dashboard,
  openReplacements,
}: AdminStudentsSnapshotProps) {
  const active = getRoleStatusCount(dashboard, "student_provider", "active");
  const suspended = getRoleStatusCount(
    dashboard,
    "student_provider",
    "suspended",
  );
  const total = dashboard.profiles.byRole.student_provider ?? 0;
  const scheduledCourses = dashboard.courses.byStatus.scheduled ?? 0;

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Élèves</h3>
          <p className="mt-1 text-xs text-ink-400">
            Activité tutorat côté apprenants
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/utilisateurs?role=student_provider">Utilisateurs →</Link>
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink-400">Actifs</dt>
          <dd className="text-2xl font-bold tabular-nums text-success">
            {active}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Inscrits</dt>
          <dd className="text-2xl font-bold tabular-nums">{total}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Cours planifiés</dt>
          <dd className="text-2xl font-bold tabular-nums">{scheduledCourses}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Suspendus</dt>
          <dd className="text-2xl font-bold tabular-nums">{suspended}</dd>
        </div>
      </dl>

      {openReplacements > 0 ? (
        <div className="mt-4 rounded-lg border border-warning/20 bg-warning-bg px-3 py-2 text-sm text-warning">
          {openReplacements} remplacement(s) ouvert(s) à superviser.
          <Link
            to="/admin/alertes"
            className="ml-1 font-medium underline"
          >
            Voir les alertes
          </Link>
        </div>
      ) : null}
    </section>
  );
}
