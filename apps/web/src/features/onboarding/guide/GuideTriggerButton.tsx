import { Button, cn } from "@gadz-connect/ui";
import { useSidebarCollapsed } from "@/features/layout/sidebarCollapse";
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
  const collapsed = useSidebarCollapsed();
  const { openGuide, progress, isLoading } = useOnboardingGuide();

  if (isLoading || !progress) {
    return null;
  }

  const isComplete = progress.isComplete;

  return (
    <Button
      type="button"
      variant="outline"
      size={collapsed ? "icon" : "sm"}
      className={cn(
        collapsed ? "relative size-10 shrink-0" : "gap-1.5",
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
      <GuideIcon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
      {!collapsed ? (
        <>
          <span>Guide</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              isComplete
                ? "bg-success-bg text-success"
                : "bg-brand-100 text-brand-700",
            )}
          >
            {isComplete
              ? "✓"
              : `${progress.completedCount}/${progress.totalCount}`}
          </span>
        </>
      ) : (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
            isComplete
              ? "bg-success-bg text-success"
              : "bg-brand-100 text-brand-700",
          )}
        >
          {isComplete ? "✓" : progress.completedCount}
        </span>
      )}
    </Button>
  );
}
