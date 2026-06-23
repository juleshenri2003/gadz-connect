import { Button, cn } from "@gadz-connect/ui";
import { useEffect, useRef } from "react";
import { formatEventTime } from "@/features/scheduling/calendar-utils";
import type { TutorSlotView } from "./slotCalendarUtils";
import {
  formatHourLabel,
  getTimelineConfig,
  labelOffsetTop,
  layoutDaySlots,
  timelineDefaultScrollTop,
  timelineGridHours,
  timelineHeight,
  timelineLabelHours,
  timelineViewportHeight,
  TIMELINE_PX_PER_HOUR,
} from "./timelineUtils";

interface TutorDayTimelineProps {
  slots: TutorSlotView[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onBookSlot: (slotId: string) => void;
}

export function TutorDayTimeline({
  slots,
  selectedSlotId,
  onSelectSlot,
  onBookSlot,
}: TutorDayTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { bounds, scrollable } = getTimelineConfig(slots);
  const height = timelineHeight(bounds);
  const viewportHeight = timelineViewportHeight();
  const gridHours = timelineGridHours(bounds);
  const labelHours = timelineLabelHours(bounds);
  const layouts = layoutDaySlots(slots, bounds);

  useEffect(() => {
    if (!scrollable) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = timelineDefaultScrollTop(slots, bounds);
  }, [slots, scrollable]);

  if (!slots.length) {
    return (
      <p className="py-8 text-center text-sm text-ink-400">
        Aucun créneau ce jour-là
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "rounded-lg border border-line/60 bg-paper/30 pr-1",
        scrollable ? "overflow-y-auto" : "overflow-hidden",
      )}
      style={{
        maxHeight: scrollable ? `min(${viewportHeight}px, 55vh)` : undefined,
      }}
    >
      <div className="flex min-w-[240px] gap-2 p-2">
        {/* Heures — label toutes les 2 h, alignées sur la grille */}
        <div className="relative w-9 shrink-0" style={{ height }}>
          {labelHours.map((hour) => (
            <span
              key={hour}
              className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-ink-400"
              style={{ top: labelOffsetTop(hour, bounds) }}
            >
              {formatHourLabel(hour)}
            </span>
          ))}
        </div>

        {/* Grille + créneaux */}
        <div
          className="relative min-w-0 flex-1 rounded-md bg-surface/80"
          style={{ height }}
        >
          {gridHours.map((hour) => (
            <div
              key={hour}
              className={cn(
                "pointer-events-none absolute inset-x-0 border-t",
                hour % 2 === 0 ? "border-line/50" : "border-line/25",
              )}
              style={{ top: (hour - bounds.startHour) * TIMELINE_PX_PER_HOUR }}
            />
          ))}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-line/50"
            style={{ top: height }}
          />

          {layouts.map(({ slot, top, height: slotHeight, column, columnCount }) => {
            const isSelected = selectedSlotId === slot.id;
            const widthPct = 100 / columnCount;
            const leftPct = column * widthPct;
            const timeLabel = formatEventTime(slot.starts_at, slot.ends_at);
            const blockHeight = Math.max(slotHeight - 2, 32);

            return (
              <div
                key={slot.id}
                role="group"
                aria-label={`Créneau ${timeLabel}`}
                className={cn(
                  "absolute flex items-center justify-between gap-2 rounded-md border px-2 py-1 transition",
                  isSelected
                    ? "z-10 border-brand-600 bg-brand-50 shadow-surface"
                    : "border-success/40 bg-success-bg/90",
                )}
                style={{
                  top: top + 1,
                  height: blockHeight,
                  left: `calc(${leftPct}% + 3px)`,
                  width: `calc(${widthPct}% - 6px)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "block truncate text-[11px] font-medium tabular-nums leading-tight",
                      isSelected ? "text-brand-700" : "text-success",
                    )}
                  >
                    {timeLabel}
                  </span>
                </button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 px-3 text-xs"
                  onClick={() => onBookSlot(slot.id)}
                >
                  Réserver
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
