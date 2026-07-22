import { Link } from "react-router-dom";
import { isStudentCampusEmpty } from "@/features/dashboard/studentDashboardTasks";

interface StudentUrgentBannersProps {
  tutorCount: number;
}

/** Bannières urgentes hors inbox (ex. campus sans tuteurs). */
export function StudentUrgentBanners({ tutorCount }: StudentUrgentBannersProps) {
  const campusEmpty = isStudentCampusEmpty(tutorCount);

  if (!campusEmpty) return null;

  return (
    <div
      className="rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
      role="status"
    >
      Aucun tuteur disponible sur votre campus pour l&apos;instant. Reconsultez{" "}
      <Link to="/app/cours" className="font-medium underline">
        Trouver mon tuteur
      </Link>{" "}
      — de nouveaux professeurs peuvent s&apos;inscrire.
    </div>
  );
}
