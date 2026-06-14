import { Link } from "react-router-dom";
import type { AdminCampusBreakdownRow } from "@/features/admin/types";
import { buildAdminPlanningHref } from "@/features/scheduling/adminScheduleUtils";

interface AdminCampusBreakdownProps {
  rows: AdminCampusBreakdownRow[];
}

export function AdminCampusBreakdown({ rows }: AdminCampusBreakdownProps) {
  if (rows.length === 0) return null;

  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div>
        <h3 className="font-semibold text-ink-900">Répartition par campus</h3>
        <p className="mt-1 text-xs text-ink-400">
          Vue inter-campus — profs, élèves et cours planifiés
        </p>
      </div>

      <ul className="mt-4 divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.campusId} className="py-4 first:pt-0">
            <Link
              to={buildAdminPlanningHref({ campusId: row.campusId })}
              className="font-medium text-brand-700 hover:underline"
            >
              {row.name}
            </Link>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-ink-400">Profs actifs</dt>
                <dd className="tabular-nums">{row.teachersActive}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Élèves actifs</dt>
                <dd className="tabular-nums">{row.studentsActive}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Cours planifiés</dt>
                <dd className="tabular-nums">{row.coursesScheduled}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">SIRET en attente</dt>
                <dd className="tabular-nums">{row.pendingSiret}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b bg-paper text-ink-600">
            <tr>
              <th className="px-3 py-2 font-medium">Campus</th>
              <th className="px-3 py-2 font-medium">Profs actifs</th>
              <th className="px-3 py-2 font-medium">Élèves actifs</th>
              <th className="px-3 py-2 font-medium">Cours planifiés</th>
              <th className="px-3 py-2 font-medium">SIRET en attente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.campusId} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">
                  <Link
                    to={buildAdminPlanningHref({ campusId: row.campusId })}
                    className="text-brand-700 hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2 tabular-nums">{row.teachersActive}</td>
                <td className="px-3 py-2 tabular-nums">{row.studentsActive}</td>
                <td className="px-3 py-2 tabular-nums">{row.coursesScheduled}</td>
                <td className="px-3 py-2 tabular-nums">{row.pendingSiret}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-400">
        Détail par campus disponible pour les administrateurs généraux.
      </p>
    </section>
  );
}

interface AdminCoursesAtRiskProps {
  awaitingReplacement: number;
  cancelled: number;
}

export function AdminCoursesAtRisk({
  awaitingReplacement,
  cancelled,
}: AdminCoursesAtRiskProps) {
  if (awaitingReplacement === 0 && cancelled === 0) return null;

  return (
    <section className="rounded-md border border-warning/20 bg-warning-bg/60 p-5">
      <h3 className="font-semibold text-warning">Cours à surveiller</h3>
      <ul className="mt-3 space-y-2 text-sm text-warning">
        {awaitingReplacement > 0 ? (
          <li>
            {awaitingReplacement} cours en attente de remplaçant —{" "}
            <Link
              to="/admin/planning?status=awaiting_replacement"
              className="font-medium underline"
            >
              voir le planning
            </Link>
          </li>
        ) : null}
        {cancelled > 0 ? (
          <li>
            {cancelled} cours annulé(s) —{" "}
            <Link
              to="/admin/planning?status=cancelled&history=1"
              className="font-medium underline"
            >
              voir le planning
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
