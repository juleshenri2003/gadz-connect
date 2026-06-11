import type { OnboardingProgress } from "./teacherOnboardingTasks";

interface OnboardingProgressBarProps {
  progress: OnboardingProgress;
}

export function OnboardingProgressBar({ progress }: OnboardingProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900">
          {progress.completedCount}/{progress.totalCount} étapes complétées
        </span>
        <span className="text-slate-500">{progress.percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l'onboarding"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
