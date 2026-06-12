import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import { ProviderTaskBanner } from "@/features/dashboard/ProviderTaskBanner";
import { useStudentDashboardProgress } from "@/features/dashboard/useStudentDashboardProgress";
import { TutorList } from "@/features/marketplace/TutorList";
import { StudentPendingReplacementBanner } from "@/features/replacements/StudentPendingReplacementBanner";

export function StudentOverviewPage() {
  const { progress, profile, tutorCount, isLoading, isError } =
    useStudentDashboardProgress();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (isError || !profile || !progress) {
    return (
      <p className="text-sm text-red-600">Impossible de charger votre profil</p>
    );
  }

  return (
    <div className="space-y-8">
      <ProviderTaskBanner />

      <StudentPendingReplacementBanner />

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="mt-1 text-sm text-slate-600">
          {profile.campus?.name
            ? `Campus ${profile.campus.name}`
            : "Votre espace élève Gadz'Connect"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="indigo"
          label="Campus"
          value={profile.campus?.name ?? "—"}
        />
        <StatCard
          accent={progress.isComplete ? "green" : "amber"}
          label="Tutorat"
          value={progress.isComplete ? "Premier cours réservé" : "À réserver"}
          hint={
            tutorCount > 0
              ? `${tutorCount} prof${tutorCount > 1 ? "s" : ""} disponible${tutorCount > 1 ? "s" : ""}`
              : "Réservez un créneau avec un tuteur"
          }
        />
        <StatCard
          label="Compte"
          value="Élève"
          hint="Pas de SIRET requis"
        />
      </div>

      <section
        id="trouver-un-tuteur"
        className="scroll-mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Trouver mon tuteur</h3>
            <p className="mt-1 text-sm text-slate-600">
              Professeurs inscrits et validés sur votre campus. Les nouveaux
              profs apparaissent ici dès que la RH valide leur dossier.
            </p>
          </div>
          {tutorCount > 0 ? (
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/cours">Voir tout →</Link>
            </Button>
          ) : null}
        </div>
        <TutorList />
      </section>
    </div>
  );
}
