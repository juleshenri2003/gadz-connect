import { cn } from "@gadz-connect/ui";
import { formatNavBadgeCount } from "@/features/dashboard/navBadgeCounts";

interface NavCountBadgeProps {
  count: number;
  className?: string;
}

export function NavCountBadge({ count, className }: NavCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white",
        className,
      )}
      aria-label={`${count} action${count > 1 ? "s" : ""} à faire`}
    >
      {formatNavBadgeCount(count)}
    </span>
  );
}
