import { useMemo, useState } from "react";
import { Button, cn } from "@gadz-connect/ui";
import { formatWeekRange } from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  addWeeks,
  countWeekEventsByDay,
  getCurrentWeekDays,
  isToday,
} from "./teacherCockpitUtils";

interface TeacherWeekStripProps {
  events: ScheduleEvent[];
  variant?: "teacher" | "student";
}

export function TeacherWeekStrip({
  events,
  variant = "teacher",
}: TeacherWeekStripProps) {
  const studentMode = variant === "student";
  const [anchor, setAnchor] = useState(() => new Date());
  const weekDays = useMemo(() => getCurrentWeekDays(anchor), [anchor]);

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
          const weekday = day.toLocaleDateString("fr-FR", { weekday: "short" });
          const dayNum = day.getDate();

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-lg border px-1 py-2 text-center sm:px-2",
                today
                  ? "border-brand-100 bg-brand-50"
                  : "border-line bg-paper/80",
              )}
            >
              <p className="text-[10px] uppercase text-ink-400">{weekday}</p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  today ? "text-brand-700" : "text-ink-900",
                )}
              >
                {dayNum}
              </p>
              <div className="mt-1 flex min-h-[1.25rem] justify-center gap-0.5">
                {courses > 0 ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-brand-500"
                    title={`${courses} session(s) confirmée(s)`}
                  />
                ) : null}
                {!studentMode && slots > 0 ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-success"
                    title={`${slots} créneau(x) ouvert(s)`}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
          {studentMode ? "Cours confirmés" : "Cours confirmés"}
        </span>
        {!studentMode ? (
          <span className="ml-3 inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            Créneaux ouverts
          </span>
        ) : null}
      </p>
    </section>
  );
}
