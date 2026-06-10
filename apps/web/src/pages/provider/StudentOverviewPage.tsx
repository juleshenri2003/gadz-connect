import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import { useMyProfile } from "@/features/auth/useMyProfile";

export function StudentOverviewPage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-red-600">Impossible de charger votre profil</p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h2>
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
          label="Tutorat"
          value="Disponible"
          hint="Réservez un créneau avec un tuteur"
        />
        <StatCard
          label="Compte"
          value="Élève"
          hint="Pas de SIRET requis"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Trouver un tuteur</h3>
        <p className="mt-2 text-sm text-slate-600">
          Parcourez les tuteurs de votre campus, choisissez un créneau et
          réservez votre session de tutorat. Vous n&apos;avez pas besoin de
          micro-entreprise ni de numéro SIRET.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/app/cours">Voir les tuteurs →</Link>
        </Button>
      </section>
    </div>
  );
}
