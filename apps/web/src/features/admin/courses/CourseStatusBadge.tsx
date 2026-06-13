import { cn } from "@gadz-connect/ui";
import {
  courseStatusLabel,
  eventStyles,
} from "@/features/scheduling/calendar-utils";

interface CourseStatusBadgeProps {
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
}

export function CourseStatusBadge({
  status,
  startsAt,
  endsAt,
}: CourseStatusBadgeProps) {
  const starts = startsAt ?? undefined;
  const ends = endsAt ?? undefined;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        eventStyles("course", status, starts, ends),
      )}
    >
      {courseStatusLabel(status) ?? status}
    </span>
  );
}
