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
    <>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border border-line bg-surface"
          />
        ))}
      </div>
      <div className="hidden grid-cols-7 gap-1 md:grid">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[72px] animate-pulse rounded-lg bg-paper"
          />
        ))}
      </div>
    </>
  );
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatMobileDayLabel(day: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(day);
}

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
            <span className="hidden md:inline">
              Cliquez sur un jour pour ouvrir la vue semaine
            </span>
            <span className="md:hidden">
              Touchez un jour pour ouvrir la vue semaine
            </span>
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

      <ul className="space-y-2 md:hidden">
        {monthDays
          .filter((day) => day.getMonth() === anchor.getMonth())
          .map((day) => {
            const summary = summarizeDayEvents(events, day);
            const isToday = isSameDay(day, today);

            return (
              <li key={day.toISOString()}>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors active:bg-paper",
                    isToday
                      ? "border-brand-100 bg-brand-50"
                      : "border-line bg-surface",
                  )}
                  onClick={() => onDayClick?.(day)}
                >
                  <p className="min-w-0 text-sm font-medium capitalize text-ink-900">
                    {formatMobileDayLabel(day)}
                  </p>
                  {summary.total > 0 ? (
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {summary.total} év.
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-ink-400">—</span>
                  )}
                </button>
              </li>
            );
          })}
      </ul>

      <div className="hidden md:block">
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
                  {summary.cancelled > 0 ? (
                    <span className="block h-1.5 w-1.5 rounded-full bg-warning-bg" />
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
