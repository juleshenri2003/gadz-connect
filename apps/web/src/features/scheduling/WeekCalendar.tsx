import { Button } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import {
  addDays,
  eventKindLabel,
  eventStyles,
  eventsForDay,
  formatDayHeader,
  formatEventTime,
  formatWeekRange,
  getWeekDays,
} from "./calendar-utils";
import type { ScheduleEvent } from "./types";

interface WeekCalendarProps {
  events: ScheduleEvent[];
  emptyLabel?: string;
  renderEventMeta?: (event: ScheduleEvent) => string | undefined;
}

export function WeekCalendar({
  events,
  emptyLabel = "Aucun événement cette semaine",
  renderEventMeta,
}: WeekCalendarProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const today = new Date();

  const weekHasEvents = weekDays.some(
    (day) => eventsForDay(events, day).length > 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {formatWeekRange(anchor)}
          </p>
          <p className="text-xs text-slate-500">Vue semaine</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAnchor((d) => addDays(d, -7))}
          >
            ← Semaine préc.
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAnchor(new Date())}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAnchor((d) => addDays(d, 7))}
          >
            Semaine suiv. →
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="grid min-w-[720px] grid-cols-7 divide-x divide-slate-100">
          {weekDays.map((day) => {
            const { weekday, day: dayNum } = formatDayHeader(day);
            const isToday = day.toDateString() === today.toDateString();
            const dayEvents = eventsForDay(events, day);

            return (
              <div key={day.toISOString()} className="min-h-[280px]">
                <div
                  className={`border-b px-2 py-3 text-center ${
                    isToday ? "bg-indigo-50" : "bg-slate-50"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {weekday}
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isToday ? "text-indigo-700" : "text-slate-800"
                    }`}
                  >
                    {dayNum}
                  </p>
                </div>
                <div className="space-y-2 p-2">
                  {dayEvents.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[10px] text-slate-400">
                      —
                    </p>
                  ) : (
                    dayEvents.map((event) => {
                      const meta =
                        renderEventMeta?.(event) ?? event.counterpartName;
                      return (
                        <div
                          key={event.id}
                          className={`rounded-lg border p-2 text-xs ${eventStyles(event.kind)}`}
                        >
                          <p className="font-semibold leading-tight">
                            {event.title}
                          </p>
                          <p className="mt-1 tabular-nums opacity-80">
                            {formatEventTime(event.startsAt, event.endsAt)}
                          </p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-70">
                            {eventKindLabel(event.kind)}
                            {event.status ? ` · ${event.status}` : ""}
                          </p>
                          {meta ? (
                            <p className="mt-1 truncate opacity-90">{meta}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!weekHasEvents ? (
        <p className="text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-emerald-200 bg-emerald-50" />
          Créneau disponible (prof)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-indigo-200 bg-indigo-50" />
          Créneau réservé / cours
        </span>
      </div>
    </div>
  );
}
