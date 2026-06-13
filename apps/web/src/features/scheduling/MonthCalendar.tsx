import { Button, cn } from "@gadz-connect/ui";
import { useEffect, useMemo, useState } from "react";
import { isSameDay } from "@/features/scheduling/calendar-utils";
import {
  formatMonthLabel,
  getMonthGridDays,
  summarizeDayEvents,
} from "@/features/scheduling/adminScheduleUtils";
import type { ScheduleEvent } from "@/features/scheduling/types";

interface MonthCalendarProps {
  events: ScheduleEvent[];
  initialAnchor?: Date;
  onAnchorChange?: (anchor: Date) => void;
  onDayClick?: (day: Date) => void;
  loading?: boolean;
}

function MonthCalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 42 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[72px] animate-pulse rounded-lg bg-paper"
        />
      ))}
    </div>
  );
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function MonthCalendar({
  events,
  initialAnchor,
  onAnchorChange,
  onDayClick,
  loading = false,
}: MonthCalendarProps) {
  const [anchor, setAnchor] = useState(() => initialAnchor ?? new Date());
  const monthDays = useMemo(() => getMonthGridDays(anchor), [anchor]);
  const today = new Date();

  useEffect(() => {
    if (initialAnchor) {
      setAnchor(initialAnchor);
    }
  }, [initialAnchor]);

  function updateAnchor(next: Date) {
    setAnchor(next);
    onAnchorChange?.(next);
  }

  function goToPreviousMonth() {
    updateAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    updateAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  }

  function goToToday() {
    updateAnchor(new Date());
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-paper" />
        <MonthCalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold capitalize text-ink-900">
            {formatMonthLabel(anchor)}
          </p>
          <p className="text-xs text-ink-400">
            Cliquez sur un jour pour ouvrir la vue semaine
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goToPreviousMonth}
          >
            ←
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goToNextMonth}
          >
            →
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const summary = summarizeDayEvents(events, day);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cn(
                "min-h-[72px] rounded-lg border p-2 text-left transition hover:border-brand-100 hover:bg-brand-50/40",
                inMonth
                  ? "border-line bg-surface"
                  : "border-transparent bg-paper/60 text-ink-400",
                isToday && "ring-2 ring-brand-100",
              )}
              onClick={() => onDayClick?.(day)}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday ? "text-brand-700" : "text-ink-900",
                )}
              >
                {day.getDate()}
              </span>
              {summary.total > 0 ? (
                <div className="mt-1 space-y-1">
                  <span className="inline-flex rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                    {summary.total}
                  </span>
                  {summary.replacements > 0 ? (
                    <span className="block h-1.5 w-1.5 rounded-full bg-warning-bg" />
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
