import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import type { OnboardingTask } from "./teacherOnboardingTasks";
import { useMarkInpiSent } from "./useMarkInpiSent";

interface OnboardingCurrentTaskCardProps {
  task: OnboardingTask;
}

export function OnboardingCurrentTaskCard({
  task,
}: OnboardingCurrentTaskCardProps) {
  const markInpiSent = useMarkInpiSent();

  const isWaitingRh = task.id === "rh_validation";

  return (
    <section className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Prochaine étape
      </p>
      <h3 className="mt-2 text-xl font-bold text-slate-900">{task.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{task.description}</p>

      {isWaitingRh ? (
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Votre SIRET a été transmis. L&apos;équipe RH valide votre dossier —
          aucune action requise de votre part.
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {task.href && !isWaitingRh ? (
          <Button asChild>
            <Link to={task.href}>
              {task.id === "questionnaire"
                ? "Compléter le questionnaire"
                : task.id === "inpi"
                  ? "Voir le guide INPI"
                  : task.id === "siret"
                    ? "Déclarer mon SIRET"
                    : task.id === "stripe"
                      ? "Configurer Stripe"
                      : task.id === "publish_slots"
                        ? "Publier des créneaux"
                        : "Continuer"}
            </Link>
          </Button>
        ) : null}

        {task.manualAction === "inpi_sent" ? (
          <Button
            variant="outline"
            disabled={markInpiSent.isPending || markInpiSent.isSuccess}
            onClick={() => void markInpiSent.mutate()}
          >
            {markInpiSent.isPending
              ? "Enregistrement…"
              : markInpiSent.isSuccess
                ? "Demande enregistrée ✓"
                : "J'ai envoyé ma demande sur l'INPI"}
          </Button>
        ) : null}
      </div>

      {markInpiSent.isSuccess ? (
        <p className="mt-3 text-sm text-green-700" role="status">
          Étape INPI validée — retournez au tableau de bord pour continuer.
        </p>
      ) : null}

      {markInpiSent.isError ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {(markInpiSent.error as Error).message}
        </p>
      ) : null}
    </section>
  );
}
