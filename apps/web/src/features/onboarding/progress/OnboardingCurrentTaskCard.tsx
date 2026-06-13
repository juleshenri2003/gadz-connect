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
  const isReadOnly = Boolean(task.readOnly);

  return (
    <section className="rounded-md border border-brand-100 bg-surface border border-brand-100 p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        Prochaine étape
      </p>
      <h3 className="mt-2 text-xl font-bold text-ink-900">{task.title}</h3>
      <p className="mt-2 text-sm text-ink-600">{task.description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {task.href && !isReadOnly ? (
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
        <p className="mt-3 text-sm text-success" role="status">
          Étape INPI validée — retournez au tableau de bord pour continuer.
        </p>
      ) : null}

      {markInpiSent.isError ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {(markInpiSent.error as Error).message}
        </p>
      ) : null}
    </section>
  );
}
