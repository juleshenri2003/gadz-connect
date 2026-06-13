import { Link } from "react-router-dom";
import { ProviderTaskBanner } from "@/features/dashboard/ProviderTaskBanner";
import { isStudentCampusEmpty } from "@/features/dashboard/studentDashboardTasks";
import { StudentPendingReplacementBanner } from "@/features/replacements/StudentPendingReplacementBanner";

interface StudentUrgentBannersProps {
  tutorCount: number;
}

export function StudentUrgentBanners({ tutorCount }: StudentUrgentBannersProps) {
  const campusEmpty = isStudentCampusEmpty(tutorCount);

  return (
    <div className="space-y-4">
      <ProviderTaskBanner />
      {campusEmpty ? (
        <div
          className="rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="status"
        >
          Aucun tuteur disponible sur votre campus pour l&apos;instant.
          Reconsultez{" "}
          <Link to="/app/cours" className="font-medium underline">
            Trouver mon tuteur
          </Link>{" "}
          — de nouveaux professeurs peuvent s&apos;inscrire.
        </div>
      ) : null}
      <StudentPendingReplacementBanner />
    </div>
  );
}
