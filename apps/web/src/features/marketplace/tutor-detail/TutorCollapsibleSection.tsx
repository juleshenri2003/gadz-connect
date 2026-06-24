import { cn } from "@gadz-connect/ui";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface TutorCollapsibleSectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  embedded?: boolean;
  nested?: boolean;
}

export function TutorCollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
  embedded = false,
  nested = false,
}: TutorCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        embedded
          ? "border-t border-brand-100 bg-surface"
          : "overflow-hidden rounded-md border border-line bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-start gap-3 py-3 text-left",
          nested ? "px-0" : "px-4 sm:px-6",
          embedded ? "hover:bg-brand-50/60" : "hover:bg-paper",
        )}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">
            {title}
          </span>
          {summary && !open ? (
            <span className="mt-0.5 block text-xs text-ink-400">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className={cn(
            "border-t py-4",
            nested ? "px-0" : "px-4 sm:px-6",
            embedded ? "border-brand-100" : "border-line",
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
