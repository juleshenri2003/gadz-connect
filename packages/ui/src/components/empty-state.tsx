import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-line bg-surface-alt px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-paper text-ink-400">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-ink-600">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Button variant="brand" asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button variant="brand" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
