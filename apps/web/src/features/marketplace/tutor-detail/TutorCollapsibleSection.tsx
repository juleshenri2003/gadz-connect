import { cn } from "@gadz-connect/ui";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface TutorCollapsibleSectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function TutorCollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
}: TutorCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-line bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper"
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
      {open ? <div className="border-t border-line px-4 py-4">{children}</div> : null}
    </section>
  );
}
