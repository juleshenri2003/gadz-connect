import { Link } from "react-router-dom";
import { StatCard } from "@/features/admin/StatCard";
import type { StudentDashboardStats } from "./studentCockpitUtils";
import { formatTutoringHours } from "./studentCockpitUtils";

interface StudentStatsRowProps {
  stats: StudentDashboardStats;
}

export function StudentStatsRow({ stats }: StudentStatsRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link to="/app/planning" className="block transition hover:opacity-90">
        <StatCard
          accent="indigo"
          label="Cours à venir"
          value={stats.upcomingCount}
          hint={
            stats.upcomingCount > 0
              ? "Séances planifiées"
              : "Réservez un prochain créneau"
          }
        />
      </Link>
      <StatCard
        accent="green"
        label="Heures de tutorat"
        value={formatTutoringHours(stats.tutoringHours)}
        hint="Cumul des cours passés"
      />
      <Link to="/app/cours" className="block transition hover:opacity-90">
        <StatCard
          label="Mes tuteurs"
          value={stats.tutorCount}
          hint={
            stats.tutorCount > 0
              ? `Prof${stats.tutorCount > 1 ? "s" : ""} déjà réservé${stats.tutorCount > 1 ? "s" : ""}`
              : "Aucun pour l'instant"
          }
        />
      </Link>
      <Link to="/app/repertoire" className="block transition hover:opacity-90">
        <StatCard
          accent={stats.summariesCount > 0 ? "amber" : undefined}
          label="Comptes-rendus"
          value={stats.summariesCount}
          hint={
            stats.summariesCount > 0
              ? "Disponibles dans le répertoire"
              : "Après dépôt par les profs"
          }
        />
      </Link>
    </div>
  );
}
