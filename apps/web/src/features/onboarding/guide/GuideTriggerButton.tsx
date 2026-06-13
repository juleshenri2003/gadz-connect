import { Button, cn } from "@gadz-connect/ui";
import { useOnboardingGuide } from "./OnboardingGuideContext";

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

export function GuideTriggerButton() {
  const { openGuide, progress, isLoading } = useOnboardingGuide();

  if (isLoading || !progress) {
    return null;
  }

  const isComplete = progress.isComplete;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "gap-1.5",
        isComplete
          ? "border-success/20 text-success hover:bg-success-bg"
          : "border-brand-100 text-brand-700 hover:bg-brand-50",
      )}
      onClick={openGuide}
      aria-label={
        isComplete
          ? "Ouvrir le guide — parcours terminé"
          : `Ouvrir le guide — ${progress.completedCount} sur ${progress.totalCount} étapes complétées`
      }
    >
      <GuideIcon className="h-4 w-4 shrink-0" />
      <span>Guide</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          isComplete
            ? "bg-success-bg text-success"
            : "bg-brand-100 text-brand-700",
        )}
      >
        {isComplete ? "✓" : `${progress.completedCount}/${progress.totalCount}`}
      </span>
    </Button>
  );
}
