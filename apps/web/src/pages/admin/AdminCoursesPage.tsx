import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { useAdminDashboard } from "@/features/admin/useAdmin";

const COURSE_STATUS: Record<string, string> = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

export function AdminCoursesPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();

  if (isLoading || !dashboard) {
    return <p className="text-sm text-slate-500">Chargement des cours…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cours</h2>
        <p className="mt-1 text-sm text-slate-600">
          {dashboard.courses.total} cours enregistré
          {dashboard.courses.total > 1 ? "s" : ""} dans la base
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(dashboard.courses.byStatus).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardDescription>
                {COURSE_STATUS[status] ?? status}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des cours récents</CardTitle>
          <CardDescription>
            Les interfaces élève / prof alimenteront cette liste plus tard
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dashboard.courses.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Titre</th>
                    <th className="px-4 py-3 font-medium">Campus</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.courses.recent.map((course) => (
                    <tr key={course.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{course.title}</td>
                      <td className="px-4 py-3">{course.campus?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {COURSE_STATUS[course.status] ?? course.status}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(course.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">
              Aucun cours pour le moment. Exécutez le script de démo ou créez des
              cours via les futures interfaces.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
