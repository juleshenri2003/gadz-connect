import { cn } from "@gadz-connect/ui";

export interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface MicroEnterpriseWizardStepperProps {
  steps: readonly WizardStep[];
  currentStep: number;
}

export function MicroEnterpriseWizardStepper({
  steps,
  currentStep,
}: MicroEnterpriseWizardStepperProps) {
  const active = steps.find((s) => s.id === currentStep);

  return (
    <div className="mt-4 space-y-3">
      <ol className="flex gap-1.5 sm:gap-2" aria-label="Étapes du questionnaire">
        {steps.map((s) => {
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;

          return (
            <li
              key={s.id}
              className={cn(
                "flex flex-1 flex-col items-center rounded-lg px-1 py-2 text-center sm:px-2",
                isActive
                  ? "bg-ink-900 text-white"
                  : isDone
                    ? "bg-line text-ink-600"
                    : "bg-paper text-ink-400",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="text-[10px] font-semibold sm:text-xs">
                {s.id}
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium leading-tight sm:block sm:text-xs">
                {s.title}
              </span>
            </li>
          );
        })}
      </ol>
      {active ? (
        <p className="text-sm text-ink-600">
          <span className="font-medium text-ink-900">
            Étape {active.id} — {active.title}
          </span>
          {" · "}
          {active.description}
        </p>
      ) : null}
    </div>
  );
}
