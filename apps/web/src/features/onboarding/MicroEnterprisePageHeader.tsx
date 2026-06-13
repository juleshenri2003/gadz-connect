import { cn } from "@gadz-connect/ui";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import {
  getMicroEnterprisePageHeader,
  isMicroEnterpriseRecapView,
  microStatusBadgeClass,
  type MicroStep,
} from "./microEnterprisePageUtils";

interface MicroEnterprisePageHeaderProps {
  profile: MyProfile | undefined;
  isLoading?: boolean;
  stepParam: MicroStep | null;
  isEditMode?: boolean;
}

export function MicroEnterprisePageHeader({
  profile,
  isLoading,
  stepParam,
  isEditMode = false,
}: MicroEnterprisePageHeaderProps) {
  const { progress } = useProviderProgress();

  if (isLoading) {
    return (
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-ink-900">Micro-entreprise</h2>
        <p className="text-sm text-ink-400">Chargement…</p>
      </header>
    );
  }

  const { title, subtitle, badgeLabel, badgeVariant, nextAction: initialNextAction } =
    getMicroEnterprisePageHeader(profile, stepParam, isEditMode);

  let nextAction = initialNextAction;

  const isRecapView = isMicroEnterpriseRecapView(profile, stepParam, isEditMode);

  if (
    profile?.account_status === "active" &&
    progress &&
    !progress.isComplete
  ) {
    const nextTask = progress.tasks.find((t) => t.status !== "done");
    if (nextTask) {
      nextAction = `Prochaine étape : ${nextTask.title} — ${nextTask.description}`;
    }
  }

  if (isRecapView) {
    nextAction = null;
  }

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          <p className="text-sm text-ink-600">{subtitle}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            microStatusBadgeClass(badgeVariant),
          )}
        >
          {badgeLabel}
        </span>
      </div>
      {nextAction ? (
        <p
          className="rounded-lg border border-brand-100 bg-brand-50/60 px-5 py-4 text-sm text-brand-700 sm:text-base"
          role="status"
        >
          {nextAction}
        </p>
      ) : null}
    </header>
  );
}
