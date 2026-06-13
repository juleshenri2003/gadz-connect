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
      <StatCard
        accent="indigo"
        label="Cours à venir"
        value={stats.upcomingCount}
        hint={
          stats.upcomingCount > 0
            ? "Sessions confirmées"
            : "Réservez votre prochain créneau"
        }
      />
      <StatCard
        accent="green"
        label="Heures de tutorat"
        value={formatTutoringHours(stats.tutoringHours)}
        hint="Cumul de vos cours passés"
      />
      <StatCard
        label="Mes tuteurs"
        value={stats.tutorCount}
        hint={
          stats.tutorCount > 0
            ? `Prof${stats.tutorCount > 1 ? "s" : ""} avec qui vous avez cours`
            : "Aucun tuteur pour l'instant"
        }
      />
      <Link to="/app/repertoire" className="block transition hover:opacity-90">
        <StatCard
          accent="amber"
          label="Comptes-rendus"
          value={stats.summariesCount}
          hint={
            stats.summariesCount > 0
              ? "Résumés disponibles dans votre répertoire"
              : "Les profs déposent leurs résumés après les cours"
          }
        />
      </Link>
    </div>
  );
}
