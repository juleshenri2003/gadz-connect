import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { formatWeekRange } from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { toDayIso } from "@/features/dashboard/dashboardActionUtils";
import {
  addWeeks,
  countWeekEventsByDay,
  getCurrentWeekDays,
  isToday,
} from "./teacherCockpitUtils";

interface TeacherWeekStripProps {
  events: ScheduleEvent[];
  variant?: "teacher" | "student";
  selectedDayIso?: string | null;
  onSelectDay?: (dayIso: string | null) => void;
  planningHref?: string;
}

export function TeacherWeekStrip({
  events,
  variant = "teacher",
  selectedDayIso = null,
  onSelectDay,
  planningHref,
}: TeacherWeekStripProps) {
  const studentMode = variant === "student";
  const [anchor, setAnchor] = useState(() => new Date());
  const weekDays = useMemo(() => getCurrentWeekDays(anchor), [anchor]);
  const weekStartIso = toDayIso(weekDays[0] ?? anchor);
  const resolvedPlanningHref =
    planningHref ?? `/app/planning?week=${weekStartIso}`;

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Cette semaine</h3>
          <p className="text-xs text-ink-400">{formatWeekRange(anchor)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAnchor((d) => addWeeks(d, -1))}
          >
            ←
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
            onClick={() => setAnchor((d) => addWeeks(d, 1))}
          >
            →
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const { courses, slots } = countWeekEventsByDay(events, day);
          const today = isToday(day);
          const dayIso = toDayIso(day);
          const selected = selectedDayIso === dayIso;
          const weekday = day.toLocaleDateString("fr-FR", { weekday: "short" });
          const dayNum = day.getDate();
          const interactive = Boolean(onSelectDay);

          const className = cn(
            "rounded-lg border px-1 py-2 text-center sm:px-2",
            selected
              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
              : today
                ? "border-brand-100 bg-brand-50"
                : "border-line bg-paper/80",
            interactive && "cursor-pointer transition hover:border-brand-100",
          );

          const inner = (
            <>
              <p className="text-[10px] uppercase text-ink-400">{weekday}</p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  selected || today ? "text-brand-700" : "text-ink-900",
                )}
              >
                {dayNum}
              </p>
              <div className="mt-1 flex min-h-[1.25rem] justify-center gap-0.5">
                {courses > 0 ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-brand-500"
                    title={`${courses} session(s)`}
                  />
                ) : null}
                {!studentMode && slots > 0 ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-success"
                    title={`${slots} créneau(x) ouvert(s)`}
                  />
                ) : null}
              </div>
            </>
          );

          if (interactive) {
            return (
              <button
                key={dayIso}
                type="button"
                className={className}
                aria-pressed={selected}
                onClick={() =>
                  onSelectDay?.(selected ? null : dayIso)
                }
              >
                {inner}
              </button>
            );
          }

          return (
            <div key={dayIso} className={className}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
            Cours
          </span>
          {!studentMode ? (
            <span className="ml-3 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              Créneaux ouverts
            </span>
          ) : null}
          {onSelectDay ? (
            <span className="ml-3 text-ink-500">
              Cliquez un jour pour filtrer l&apos;agenda
            </span>
          ) : null}
        </p>
        <Link
          to={resolvedPlanningHref}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Voir dans le planning →
        </Link>
      </div>
    </section>
  );
}
