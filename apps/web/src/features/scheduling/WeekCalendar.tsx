import { Button, cn } from "@gadz-connect/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDays,
  countWeekSummary,
  eventKindLabel,
  eventStyles,
  eventsForDay,
  formatDayHeader,
  formatEventTime,
  formatSessionDurationLabel,
  formatWeekRange,
  getWeekDays,
  isEventPast,
} from "./calendar-utils";
import type { ScheduleEvent } from "./types";

interface WeekCalendarProps {
  events: ScheduleEvent[];
  emptyLabel?: string;
  emptyLabelWeekOnly?: string;
  loading?: boolean;
  teacherMode?: boolean;
  showLegend?: boolean;
  legendVariant?: "teacher" | "student";
  showDuration?: boolean;
  emptyAction?: ReactNode;
  initialAnchor?: Date;
  onAnchorChange?: (anchor: Date) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventTitle?: (event: ScheduleEvent) => string;
  renderEventSubtitle?: (event: ScheduleEvent) => string | undefined;
  renderEventMeta?: (event: ScheduleEvent) => string | undefined;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
  renderEventExtra?: (event: ScheduleEvent) => ReactNode;
}

function WeekCalendarSkeleton() {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-md border border-line bg-surface animate-pulse"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="h-4 w-24 rounded bg-line" />
              <div className="h-4 w-4 rounded bg-line" />
            </div>
            <div className="space-y-2 p-3">
              <div className="h-14 rounded-lg bg-paper" />
              <div className="h-10 rounded-lg bg-paper" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-md border border-line bg-surface md:block">
        <div className="grid min-w-[720px] grid-cols-7 divide-x divide-line">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="min-h-[280px] animate-pulse">
              <div className="border-b bg-paper px-2 py-3">
                <div className="mx-auto h-3 w-8 rounded bg-line" />
                <div className="mx-auto mt-2 h-6 w-6 rounded bg-line" />
              </div>
              <div className="space-y-2 p-2">
                <div className="h-16 rounded-lg bg-paper" />
                <div className="h-12 rounded-lg bg-paper" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WeekSummaryPills({
  sessions,
  openSlots,
}: {
  sessions: number;
  openSlots: number;
}) {
  if (sessions === 0 && openSlots === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-600">
      {sessions > 0 ? (
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
          {sessions} session{sessions > 1 ? "s" : ""}
        </span>
      ) : null}
      {openSlots > 0 ? (
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          {openSlots} créneau{openSlots > 1 ? "x" : ""} ouvert
          {openSlots > 1 ? "s" : ""}
        </span>
      ) : null}
    </div>
  );
}

function EventCard({
  event,
  teacherMode,
  showDuration,
  onEventClick,
  renderEventTitle,
  renderEventSubtitle,
  renderEventMeta,
  renderEventActions,
  renderEventExtra,
}: {
  event: ScheduleEvent;
  teacherMode?: boolean;
  showDuration?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventTitle?: (event: ScheduleEvent) => string;
  renderEventSubtitle?: (event: ScheduleEvent) => string | undefined;
  renderEventMeta?: (event: ScheduleEvent) => string | undefined;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
  renderEventExtra?: (event: ScheduleEvent) => ReactNode;
}) {
  const past = isEventPast(event.startsAt, event.endsAt);
  const title = renderEventTitle?.(event) ?? event.title;
  const subtitle = renderEventSubtitle?.(event);
  const meta = renderEventMeta?.(event) ?? event.counterpartName;
  const duration = showDuration
    ? formatSessionDurationLabel(event.startsAt, event.endsAt)
    : null;

  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <p
          className={cn(
            "font-semibold leading-tight",
            teacherMode ? "text-sm" : "text-xs",
          )}
        >
          {title}
        </p>
        {past ? (
          <span className="rounded bg-line/80 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-600">
            Passé
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-0.5 truncate text-xs opacity-80">{subtitle}</p>
      ) : null}
      <p className="mt-1 tabular-nums text-xs opacity-80">
        {formatEventTime(event.startsAt, event.endsAt)}
        {duration ? (
          <span className="ml-1 text-ink-400">· {duration}</span>
        ) : null}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-70">
        {eventKindLabel(event.kind, event.status)}
      </p>
      {meta ? (
        <p className="mt-1 truncate text-xs opacity-90">{meta}</p>
      ) : null}
      {renderEventExtra?.(event)}
      {!onEventClick ? renderEventActions?.(event) : null}
    </>
  );

  const className = cn(
    "rounded-lg border p-2 text-left",
    teacherMode ? "text-sm" : "text-xs",
    eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
    past && "opacity-60",
    onEventClick &&
      "cursor-pointer transition hover:border-brand-100 hover:shadow-surface",
  );

  if (onEventClick) {
    return (
      <button
        type="button"
        className={cn(className, "w-full")}
        onClick={() => onEventClick(event)}
      >
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}

function MobileDayAccordion({
  weekDays,
  events,
  today,
  teacherMode,
  showDuration,
  onEventClick,
  renderEventTitle,
  renderEventSubtitle,
  renderEventMeta,
  renderEventActions,
  renderEventExtra,
}: {
  weekDays: Date[];
  events: ScheduleEvent[];
  today: Date;
  teacherMode?: boolean;
  showDuration?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventTitle?: (event: ScheduleEvent) => string;
  renderEventSubtitle?: (event: ScheduleEvent) => string | undefined;
  renderEventMeta?: (event: ScheduleEvent) => string | undefined;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
  renderEventExtra?: (event: ScheduleEvent) => ReactNode;
}) {
  const [openDay, setOpenDay] = useState(() => today.toISOString());

  return (
    <div className="space-y-2 md:hidden">
      {weekDays.map((day) => {
        const { weekday, day: dayNum } = formatDayHeader(day);
        const isToday = day.toDateString() === today.toDateString();
        const dayEvents = eventsForDay(events, day);
        const dayKey = day.toISOString();
        const isOpen = openDay === dayKey;

        return (
          <div
            key={dayKey}
            className="overflow-hidden rounded-md border border-line bg-surface"
          >
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left",
                isToday ? "bg-brand-50" : "bg-paper",
              )}
              onClick={() => setOpenDay(isOpen ? "" : dayKey)}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-ink-900">
                {weekday} {dayNum}
                {isToday ? (
                  <span className="ml-2 text-xs font-normal text-brand-600">
                    Aujourd&apos;hui
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-ink-400">
                {dayEvents.length} événement{dayEvents.length !== 1 ? "s" : ""}
              </span>
            </button>
            {isOpen ? (
              <div className="space-y-2 border-t border-line p-3">
                {dayEvents.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-400">—</p>
                ) : (
                  dayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      teacherMode={teacherMode}
                      showDuration={showDuration}
                      onEventClick={onEventClick}
                      renderEventTitle={renderEventTitle}
                      renderEventSubtitle={renderEventSubtitle}
                      renderEventMeta={renderEventMeta}
                      renderEventActions={renderEventActions}
                      renderEventExtra={renderEventExtra}
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function WeekCalendar({
  events,
  emptyLabel = "Aucun événement cette semaine",
  emptyLabelWeekOnly = "Aucun événement cette semaine — utilisez ← → pour parcourir les autres semaines.",
  loading = false,
  teacherMode = false,
  showLegend = true,
  legendVariant,
  showDuration = false,
  emptyAction,
  initialAnchor,
  onAnchorChange,
  onEventClick,
  renderEventTitle,
  renderEventSubtitle,
  renderEventMeta,
  renderEventActions,
  renderEventExtra,
}: WeekCalendarProps) {
  const [anchor, setAnchor] = useState(() => initialAnchor ?? new Date());
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const today = new Date();

  function updateAnchor(next: Date) {
    setAnchor(next);
    onAnchorChange?.(next);
  }

  useEffect(() => {
    if (initialAnchor) {
      setAnchor(initialAnchor);
    }
  }, [initialAnchor]);

  const weekHasEvents = weekDays.some(
    (day) => eventsForDay(events, day).length > 0,
  );
  const hasAnyEvents = events.length > 0;
  const weekSummary = useMemo(
    () => countWeekSummary(events, weekDays),
    [events, weekDays],
  );

  const resolvedEmptyLabel = !weekHasEvents
    ? hasAnyEvents
      ? emptyLabelWeekOnly
      : emptyLabel
    : null;

  const resolvedLegendVariant =
    legendVariant ?? (teacherMode ? "teacher" : "student");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-10 w-48 animate-pulse rounded bg-paper" />
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-paper" />
            <div className="h-8 w-20 animate-pulse rounded bg-paper" />
            <div className="h-8 w-24 animate-pulse rounded bg-paper" />
          </div>
        </div>
        <WeekCalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-900">
            {formatWeekRange(anchor)}
          </p>
          <p className="text-xs text-ink-400">Vue semaine</p>
          {teacherMode ? (
            <WeekSummaryPills
              sessions={weekSummary.sessions}
              openSlots={weekSummary.openSlots}
            />
          ) : null}
        </div>
        <div className="flex w-full gap-1 sm:w-auto sm:gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 flex-1 px-2 sm:flex-none sm:px-3"
            aria-label="Semaine précédente"
            onClick={() => updateAnchor(addDays(anchor, -7))}
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Semaine préc.</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 shrink-0 px-3"
            onClick={() => updateAnchor(new Date())}
          >
            Auj.
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 flex-1 px-2 sm:flex-none sm:px-3"
            aria-label="Semaine suivante"
            onClick={() => updateAnchor(addDays(anchor, 7))}
          >
            <span className="hidden sm:inline">Semaine suiv.</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
      </div>

      <MobileDayAccordion
        weekDays={weekDays}
        events={events}
        today={today}
        teacherMode={teacherMode}
        showDuration={showDuration}
        onEventClick={onEventClick}
        renderEventTitle={renderEventTitle}
        renderEventSubtitle={renderEventSubtitle}
        renderEventMeta={renderEventMeta}
        renderEventActions={renderEventActions}
        renderEventExtra={renderEventExtra}
      />

      <div className="hidden overflow-x-auto rounded-md border border-line bg-surface md:block">
        <div className="grid min-w-[720px] grid-cols-7 divide-x divide-line">
          {weekDays.map((day) => {
            const { weekday, day: dayNum } = formatDayHeader(day);
            const isToday = day.toDateString() === today.toDateString();
            const dayEvents = eventsForDay(events, day);

            return (
              <div key={day.toISOString()} className="min-h-[280px]">
                <div
                  className={`border-b px-2 py-3 text-center ${
                    isToday ? "bg-brand-50" : "bg-paper"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                    {weekday}
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isToday ? "text-brand-700" : "text-ink-900"
                    }`}
                  >
                    {dayNum}
                  </p>
                </div>
                <div className="space-y-2 p-2">
                  {dayEvents.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[10px] text-ink-400">
                      —
                    </p>
                  ) : (
                    dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        teacherMode={teacherMode}
                        showDuration={showDuration}
                        onEventClick={onEventClick}
                        renderEventTitle={renderEventTitle}
                        renderEventSubtitle={renderEventSubtitle}
                        renderEventMeta={renderEventMeta}
                        renderEventActions={renderEventActions}
                        renderEventExtra={renderEventExtra}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {resolvedEmptyLabel ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-400">{resolvedEmptyLabel}</p>
          {emptyAction && !hasAnyEvents ? emptyAction : null}
        </div>
      ) : null}

      {showLegend ? (
        <div className="flex flex-wrap gap-3 text-xs text-ink-600">
          {resolvedLegendVariant === "teacher" ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-success/20 bg-success-bg" />
              Créneau disponible
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-brand-100 bg-brand-50" />
            {resolvedLegendVariant === "student"
              ? "Session planifiée"
              : "Session réservée"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-warning/30 bg-warning-bg" />
            Remplacement en cours
          </span>
          {resolvedLegendVariant === "teacher" ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-line bg-paper" />
                Terminé
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-line bg-paper line-through" />
                Annulé
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-line bg-paper opacity-60" />
              Passé
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
