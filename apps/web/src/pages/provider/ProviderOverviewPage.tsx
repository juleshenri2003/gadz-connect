import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import { STATUS_LABELS } from "@/features/admin/format";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { ProviderTaskBanner } from "@/features/dashboard/ProviderTaskBanner";
import { TeacherOnboardingDashboard } from "@/features/onboarding/progress/TeacherOnboardingDashboard";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";
import { StudentOverviewPage } from "@/pages/provider/StudentOverviewPage";

function TeacherStatsContent() {
  const { data: profile } = useMyProfile();
  const { data: stripe } = useStripeConnectStatus();

  if (!profile) return null;

  const onboardingDone = Boolean(profile.micro_enterprise_activity);
  const isActive = profile.account_status === "active";

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="mt-1 text-sm text-slate-600">
          {profile.campus?.name
            ? `Campus ${profile.campus.name}`
            : "Votre espace prestataire Gadz'Connect"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent={isActive ? "green" : "amber"}
          label="Statut compte"
          value={STATUS_LABELS[profile.account_status]}
          hint={
            profile.siret ? `SIRET ${profile.siret}` : "SIRET non renseigné"
          }
        />
        <StatCard
          accent={onboardingDone ? "indigo" : "slate"}
          label="Micro-entreprise"
          value={onboardingDone ? "Configurée" : "À compléter"}
          hint={
            profile.micro_enterprise_activity
              ? profile.micro_enterprise_activity
              : "Onboarding fiscal requis"
          }
        />
        <StatCard
          accent={stripe?.onboardingComplete ? "green" : "amber"}
          label="Paiements Stripe"
          value={
            stripe?.onboardingComplete
              ? "Actif"
              : stripe?.hasAccount
                ? "En cours"
                : "Non configuré"
          }
        />
        <StatCard
          label="Cours"
          value="—"
          hint="Proposez vos créneaux de tutorat"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Prochaines actions</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {isActive && !stripe?.onboardingComplete ? (
              <li className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
                <span>Configurer Stripe Connect pour les virements</span>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/paiements">Paiements →</Link>
                </Button>
              </li>
            ) : null}
            {onboardingDone && isActive && stripe?.onboardingComplete ? (
              <li className="rounded-lg bg-green-50 px-4 py-3 text-green-800">
                Votre compte est prêt. Publiez vos créneaux dans l&apos;onglet
                Mes cours.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Informations fiscales</h3>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Activité</dt>
              <dd className="font-medium">
                {profile.micro_enterprise_activity ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">URSSAF</dt>
              <dd className="font-medium">
                {profile.urssaf_periodicity ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Versement libératoire</dt>
              <dd className="font-medium">
                {profile.versement_liberatoire ? "Oui" : "Non"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Campus</dt>
              <dd className="font-medium">{profile.campus?.name ?? "—"}</dd>
            </div>
          </dl>
          <Button className="mt-6" size="sm" variant="outline" asChild>
            <Link to="/app/profil">Voir mon profil →</Link>
          </Button>
        </section>
      </div>
    </>
  );
}

export function ProviderOverviewPage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement du tableau de bord…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-red-600">Impossible de charger votre profil</p>
    );
  }

  if (isStudent(profile.role)) {
    return <StudentOverviewPage />;
  }

  return (
    <TeacherOnboardingDashboard>
      <ProviderTaskBanner />
      <TeacherStatsContent />
    </TeacherOnboardingDashboard>
  );
}
