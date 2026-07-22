import { cn } from "@gadz-connect/ui";
import {
  courseStatusLabel,
  eventKindLabel,
  eventStyles,
  formatEventTime,
  formatSessionDurationLabel,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import { groupEventsByDay } from "@/features/scheduling/adminScheduleUtils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { formatSessionWhen } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

interface AdminAgendaListProps {
  events: ScheduleEvent[];
  loading?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  emptyLabel?: string;
  getEventEmphasis?: (event: ScheduleEvent) => "focus" | "fade" | "normal";
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-lg border border-line bg-paper"
        />
      ))}
    </div>
  );
}

function AdminAgendaListItem({
  event,
  onEventClick,
  emphasis = "normal",
}: {
  event: ScheduleEvent;
  onEventClick?: (event: ScheduleEvent) => void;
  emphasis?: "focus" | "fade" | "normal";
}) {
  const past = isEventPast(event.startsAt, event.endsAt);
  const duration = formatSessionDurationLabel(event.startsAt, event.endsAt);
  const missingSummary =
    past && !event.hasSummary && event.status !== "cancelled";

  const inner = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
            )}
          >
            {eventKindLabel(event.kind, event.status)}
          </span>
          {event.campusName ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
              {event.campusName}
            </span>
          ) : null}
          {emphasis === "focus" ? (
            <span className="rounded bg-ink-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Focus
            </span>
          ) : null}
          {missingSummary ? (
            <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              CR manquant
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-medium text-ink-900">{event.title}</p>
        <p className="mt-0.5 text-sm text-ink-600">
          {formatSessionWhen(event.startsAt, event.endsAt)}
          <span className="ml-2 text-ink-400">
            ({formatEventTime(event.startsAt, event.endsAt)}
            {duration ? ` · ${duration}` : ""})
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-400">
          {[
            event.providerName ? `Prof : ${event.providerName}` : null,
            event.clientName ? `Élève : ${event.clientName}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-ink-400">
        {courseStatusLabel(event.status) ?? event.status}
      </div>
    </div>
  );

  const emphasisClass =
    emphasis === "fade"
      ? "opacity-25 saturate-50"
      : emphasis === "focus"
        ? "ring-2 ring-ink-900/20 shadow-surface"
        : past
          ? "opacity-80"
          : undefined;

  if (onEventClick) {
    return (
      <li>
        <button
          type="button"
          className={cn(
            "w-full rounded-lg border p-4 text-left transition hover:border-brand-100 hover:bg-brand-50/30",
            eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
            emphasisClass,
          )}
          onClick={() => onEventClick(event)}
        >
          {inner}
        </button>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-lg border p-4",
        eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
        emphasisClass,
      )}
    >
      {inner}
    </li>
  );
}

export function AdminAgendaList({
  events,
  loading,
  onEventClick,
  emptyLabel = "Aucune session sur cette période.",
  getEventEmphasis,
}: AdminAgendaListProps) {
  if (loading) return <ListSkeleton />;

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-600">{emptyLabel}</p>
    );
  }

  const groups = groupEventsByDay(events);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.day.toISOString()}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
            {group.day.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · {group.events.length} session
            {group.events.length > 1 ? "s" : ""}
          </h3>
          <ul className="space-y-3">
            {group.events.map((event) => (
              <AdminAgendaListItem
                key={event.id}
                event={event}
                onEventClick={onEventClick}
                emphasis={getEventEmphasis?.(event) ?? "normal"}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
