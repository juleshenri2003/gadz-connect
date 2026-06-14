import { cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  getMicroEnterpriseTimelineSteps,
  type MicroStep,
} from "./microEnterprisePageUtils";

interface MicroEnterpriseTimelineProps {
  profile: MyProfile;
  stepParam: MicroStep | null;
}

export function MicroEnterpriseTimeline({
  profile,
  stepParam,
}: MicroEnterpriseTimelineProps) {
  const steps = getMicroEnterpriseTimelineSteps(profile, stepParam);

  if (profile.account_status === "active") return null;

  return (
    <section
      className="rounded-md border border-brand-100 bg-surface-alt p-5 sm:p-6"
      aria-label="Étapes micro-entreprise"
    >
      <div
        className="flex flex-col gap-3 sm:flex-row"
        role="list"
      >
        {steps.map((step) => (
          <Link
            key={step.id}
            to={step.href}
            role="listitem"
            className={cn(
              "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors sm:text-base",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
              step.isDone
                ? "border-success/20 bg-success-bg text-success hover:bg-success-bg"
                : step.isWaiting
                  ? "border-warning/20 bg-warning-bg text-warning hover:bg-warning-bg"
                  : step.isCurrent
                    ? "border-brand-100 bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                    : "border-line bg-surface text-ink-600 hover:border-brand-100 hover:bg-brand-50/40",
            )}
            aria-current={step.isCurrent ? "step" : undefined}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.isDone
                  ? "bg-success text-white"
                  : step.isWaiting
                    ? "border-2 border-warning/40 bg-warning-bg text-warning"
                    : step.isCurrent
                      ? "bg-brand-600 text-white"
                      : "border border-line bg-surface text-ink-400",
              )}
              aria-hidden
            >
              {step.isDone ? "✓" : step.isCurrent ? "●" : "○"}
            </span>
            <span className="min-w-0 leading-snug">{step.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
