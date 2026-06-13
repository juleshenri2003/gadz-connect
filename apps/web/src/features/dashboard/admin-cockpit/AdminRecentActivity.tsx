import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import type { AdminDashboardData } from "@/features/admin/types";
import { courseStatusLabel } from "./adminCockpitUtils";

interface AdminRecentActivityProps {
  dashboard: AdminDashboardData;
}

function formatMemberName(firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || "Membre";
}

export function AdminRecentActivity({ dashboard }: AdminRecentActivityProps) {
  const recentCourses = dashboard.courses.recent.slice(0, 5);
  const recentProfiles = dashboard.recentProfiles.slice(0, 5);

  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Activité récente</h3>
          <p className="text-xs text-ink-400">
            Derniers cours créés et nouvelles inscriptions
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/cours">Tous les cours →</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-medium text-ink-600">Cours récents</h4>
          {recentCourses.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recentCourses.map((course) => (
                <li
                  key={course.id}
                  className="rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-ink-900">{course.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {courseStatusLabel(course.status)}
                    {course.campus?.name ? ` · ${course.campus.name}` : ""}
                    {" · "}
                    {new Date(course.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-400">Aucun cours récent.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-ink-600">
            Inscriptions récentes
          </h4>
          {recentProfiles.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recentProfiles.map((profile) => (
                <li
                  key={profile.id}
                  className="rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-ink-900">
                    {formatMemberName(profile.first_name, profile.last_name)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                    {" · "}
                    {STATUS_LABELS[profile.account_status]}
                    {profile.campus?.name ? ` · ${profile.campus.name}` : ""}
                    {" · "}
                    {new Date(profile.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-400">
              Aucune inscription récente.
            </p>
          )}
          <Button className="mt-4" size="sm" variant="outline" asChild>
            <Link to="/admin/utilisateurs">Gérer les utilisateurs →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
