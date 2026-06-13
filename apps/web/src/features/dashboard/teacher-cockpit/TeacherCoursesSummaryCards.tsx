import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { getFutureSlots } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import { useMySlots } from "@/features/marketplace/useTutors";
import { useCoursesToDocument } from "@/features/repository/useRepository";

export function TeacherCoursesSummaryCards() {
  const { data: slots } = useMySlots();
  const { data: coursesToDocument } = useCoursesToDocument();
  const futureCount = getFutureSlots(slots).length;
  const docCount = coursesToDocument?.length ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Créneaux</h3>
        <p className="mt-1 text-sm text-ink-600">
          {futureCount > 0
            ? `${futureCount} créneau${futureCount > 1 ? "x" : ""} à venir publié${futureCount > 1 ? "s" : ""}.`
            : "Aucun créneau à venir — publiez une disponibilité."}
        </p>
        <Button className="mt-4" size="sm" variant="outline" asChild>
          <Link to={coursesTabHref("slots")}>Gérer mes créneaux →</Link>
        </Button>
      </section>

      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Documentation</h3>
        <p className="mt-1 text-sm text-ink-600">
          {docCount > 0
            ? `${docCount} séance${docCount > 1 ? "s" : ""} en attente de résumé.`
            : "Aucune séance à documenter pour le moment."}
        </p>
        <Button className="mt-4" size="sm" variant="outline" asChild>
          <Link to={coursesTabHref("documentation")}>
            {docCount > 0 ? "Documenter →" : "Voir Mes cours →"}
          </Link>
        </Button>
      </section>
    </div>
  );
}
