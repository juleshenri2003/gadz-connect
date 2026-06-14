import type { RegistrationPath } from "@gadz-connect/types";
import { Button, cn } from "@gadz-connect/ui";
import type { DashboardProgress, DashboardTask } from "@/features/dashboard/dashboardTypes";
import { BrandLogo } from "@/features/onboarding/guide/brands/BrandLogo";
import {
  getGuideStepContent,
  getTeacherStepBrand,
} from "@/features/onboarding/guide/guideContent";
import { useOnboardingGuide } from "@/features/onboarding/guide/OnboardingGuideContext";

interface ProviderJourneyCardProps {
  progress: DashboardProgress;
  registrationPath: RegistrationPath;
  variant?: "pending" | "finalize";
  title?: string;
  subtitle?: string;
}

function GuideIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M6 3.5h8a1 1 0 0 1 1 1v11l-3.5-2-3.5 2v-11a1 1 0 0 1 1-1z"
        strokeLinejoin="round"
      />
      <path d="M8 7h4M8 10h4" strokeLinecap="round" />
    </svg>
  );
}

const STEP_TIMELINE_LABELS: Record<string, string> = {
  profile: "Profil",
  questionnaire: "Questionnaire fiscal",
  inpi: "INPI",
  siret: "SIRET",
  stripe: "Paiements",
  publish_slots: "Créneaux",
};

function StepChip({
  task,
  isDone,
  isCurrent,
  isWaiting,
  onClick,
}: {
  task: DashboardTask;
  isDone: boolean;
  isCurrent: boolean;
  isWaiting: boolean;
  onClick: () => void;
}) {
  const label = STEP_TIMELINE_LABELS[task.id] ?? task.title;

  return (
    <button
      type="button"
      role="listitem"
      title={task.title}
      aria-label={`${task.title}${isDone ? " — terminée" : isCurrent ? " — en cours" : isWaiting ? " — en attente" : " — à faire"}`}
      aria-current={isCurrent ? "step" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
        isDone
          ? "border-success/20 bg-success-bg text-success hover:bg-success-bg"
          : isWaiting
            ? "border-warning/20 bg-warning-bg text-warning hover:bg-warning-bg"
            : isCurrent
              ? "border-brand-100 bg-brand-50 text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
              : "border-line bg-surface text-ink-600 hover:border-brand-100 hover:bg-brand-50/40",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          isDone
            ? "bg-success text-white"
            : isWaiting
              ? "border-2 border-warning/40 bg-warning-bg text-warning"
              : isCurrent
                ? "bg-brand-600 text-white"
                : "border border-line bg-surface text-ink-400",
        )}
        aria-hidden
      >
        {isDone ? "✓" : isCurrent ? "●" : "○"}
      </span>
      <span className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
        {label}
      </span>
    </button>
  );
}

function StepTimeline({
  tasks,
  currentTaskIndex,
  onStepClick,
}: {
  tasks: DashboardTask[];
  currentTaskIndex: number;
  onStepClick: (taskId: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
      role="list"
      aria-label="Étapes du parcours"
    >
      {tasks.map((task, index) => {
        const isDone = task.status === "done";
        const isCurrent = index === currentTaskIndex && !isDone;
        const isWaiting = Boolean(task.readOnly) && !isDone;

        return (
          <StepChip
            key={task.id}
            task={task}
            isDone={isDone}
            isCurrent={isCurrent}
            isWaiting={isWaiting}
            onClick={() => onStepClick(task.id)}
          />
        );
      })}
    </div>
  );
}

function NextStepFocus({
  task,
  registrationPath,
  onOpenGuide,
}: {
  task: DashboardTask;
  registrationPath: RegistrationPath;
  onOpenGuide: () => void;
}) {
  const brand = getTeacherStepBrand(task.id);
  const guideContent = getGuideStepContent(task, false, registrationPath);
  const isWaiting = task.readOnly && task.status !== "done";

  return (
    <div
      className={cn(
        "mt-4 rounded-md border px-4 py-4 sm:px-5",
        isWaiting
          ? "border-warning/20 bg-warning-bg/60"
          : "border-brand-100 bg-brand-50/50 shadow-surface ring-1 ring-brand-100",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
        {isWaiting ? "En attente" : "Prochaine étape"}
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {brand ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-surface bg-surface p-1.5 shadow-surface">
              <BrandLogo brand={brand} size="md" />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink-900">{task.title}</p>
            <p className="mt-1 text-sm text-ink-600">
              {isWaiting && guideContent.waitingMessage
                ? guideContent.waitingMessage
                : task.description}
            </p>
          </div>
        </div>

        {!isWaiting ? (
          <Button
            type="button"
            className="h-11 w-full shrink-0 gap-2 px-5 text-sm font-semibold shadow-raised sm:w-auto"
            onClick={onOpenGuide}
          >
            <GuideIcon className="h-5 w-5 shrink-0" />
            Ouvrir le guide
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ProviderJourneyCard({
  progress,
  registrationPath,
  variant = "finalize",
  title = "Mon parcours prestataire",
  subtitle,
}: ProviderJourneyCardProps) {
  const { openGuide, openGuideAt, currentTaskIndex, lastOnboardingStepId } =
    useOnboardingGuide();

  const currentTask =
    progress.tasks[currentTaskIndex] ??
    progress.tasks.find((t) => t.status !== "done") ??
    progress.tasks[progress.tasks.length - 1];

  return (
    <section
      className={cn(
        "rounded-md border p-4 shadow-surface sm:p-5",
        variant === "pending"
          ? "border-warning/20 bg-warning-bg/30"
          : "border-brand-100 bg-surface-alt border border-line",
      )}
      aria-label="Parcours prestataire"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-ink-600">{subtitle}</p>
          ) : null}
          {lastOnboardingStepId ? (
            <p className="mt-1 text-xs text-brand-600">
              Reprendre à l&apos;étape «{" "}
              {STEP_TIMELINE_LABELS[lastOnboardingStepId] ?? lastOnboardingStepId}
              »
            </p>
          ) : null}
        </div>
        <p className="text-sm font-medium text-brand-700">
          {progress.isComplete ? (
            <span className="text-success">Parcours terminé ✓</span>
          ) : (
            <>
              {progress.completedCount}/{progress.totalCount} · {progress.percent}
              %
            </>
          )}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du parcours"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progress.isComplete ? "bg-success" : "bg-brand-600",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="mt-4">
        <StepTimeline
          tasks={progress.tasks}
          currentTaskIndex={currentTaskIndex}
          onStepClick={openGuideAt}
        />
      </div>

      {progress.isComplete ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/20 bg-success-bg/60 px-4 py-3">
          <p className="text-sm text-success">
            Toutes les étapes sont complétées. Votre espace prestataire est
            actif.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 border-success/30 px-4 text-sm font-semibold text-success shadow-surface hover:bg-success-bg"
            onClick={openGuide}
          >
            <GuideIcon className="h-5 w-5 shrink-0" />
            Revoir le guide
          </Button>
        </div>
      ) : currentTask ? (
        <NextStepFocus
          task={currentTask}
          registrationPath={registrationPath}
          onOpenGuide={openGuide}
        />
      ) : null}
    </section>
  );
}
