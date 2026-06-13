import { cn } from "@gadz-connect/ui";

export type DestinationIcon = "profile" | "tutors" | "calendar" | "folder" | "courses" | "payments" | "micro";

const ICON_MAP: Record<DestinationIcon, () => JSX.Element> = {
  profile: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
    </svg>
  ),
  tutors: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="14" cy="8" r="2" />
      <path d="M2 17c0-2.5 2.2-4.5 5-4.5M11 17c0-2 1.5-3.5 3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M3 8h14M7 2v3M13 2v3" strokeLinecap="round" />
    </svg>
  ),
  folder: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 6a1 1 0 0 1 1-1h4l1.5 2H16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" />
    </svg>
  ),
  courses: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 5.5 10 3l6 2.5v7L10 15l-6-2.5v-7z" />
      <path d="M10 10.5v4.5" />
    </svg>
  ),
  payments: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="5" width="16" height="10" rx="1.5" />
      <path d="M2 8h16" />
    </svg>
  ),
  micro: () => (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
    </svg>
  ),
};

interface GuideDestinationHintProps {
  icon: DestinationIcon;
  label: string;
  className?: string;
}

export function GuideDestinationHint({
  icon,
  label,
  className,
}: GuideDestinationHintProps) {
  const Icon = ICON_MAP[icon];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line bg-paper/80 px-3 py-2 text-ink-600",
        className,
      )}
    >
      <span className="text-brand-600">
        <Icon />
      </span>
      <p className="text-xs">
        <span className="text-ink-400">Destination · </span>
        <span className="font-medium text-ink-600">{label}</span>
      </p>
    </div>
  );
}
