import * as React from "react";
import { cn } from "../lib/utils";

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  href?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  accent = false,
  className,
  ...props
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-surface p-4 shadow-surface",
        accent ? "border-accent-100 bg-accent-50/30" : "border-line",
        className,
      )}
      {...props}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight",
          accent ? "text-accent-600" : "text-ink-900",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
