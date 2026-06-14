import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import type { ReactNode } from "react";
import {
  eventKindLabel,
  eventStyles,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  formatRelativeWhen,
  formatSessionWhen,
  getSessionLabel,
  getUpcomingEvents,
  isConfirmedSession,
} from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";

interface TeacherAgendaListProps {
  events: ScheduleEvent[];
  variant?: "compact" | "full";
  showHistory?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  headerLink?: { label: string; to: string };
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
  loading?: boolean;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg border border-line bg-paper"
        />
      ))}
    </div>
  );
}

function AgendaListItem({
  event,
  onEventClick,
  renderEventActions,
  compactActions,
}: {
  event: ScheduleEvent;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventActions?: (event: ScheduleEvent) => ReactNode;
  compactActions?: boolean;
}) {
  const past = isEventPast(event.startsAt, event.endsAt);
  const title =
    event.kind === "slot_available" ? "Créneau ouvert" : getSessionLabel(event);

  const content = (
    <>
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
            {past ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                Passé
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-medium text-ink-900">{title}</p>
          {event.kind !== "slot_available" ? (
            <p className="mt-0.5 text-xs text-ink-600">{event.title}</p>
          ) : null}
          <p className="mt-1 text-sm text-ink-600">
            {formatSessionWhen(event.startsAt, event.endsAt)}
          </p>
        </div>
        {!past ? (
          <span className="shrink-0 text-xs font-medium text-ink-400">
            {formatRelativeWhen(event.startsAt)}
          </span>
        ) : null}
      </div>
      {renderEventActions && !compactActions ? (
        <div className="mt-3">{renderEventActions(event)}</div>
      ) : null}
    </>
  );

  if (onEventClick) {
    return (
      <li>
        <button
          type="button"
          className={cn(
            "w-full rounded-lg border p-4 text-left transition hover:border-brand-100 hover:bg-brand-50/30",
            eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
            past && "opacity-70",
          )}
          onClick={() => onEventClick(event)}
        >
          {content}
        </button>
        {renderEventActions && compactActions ? (
          <div className="mt-2 px-1">{renderEventActions(event)}</div>
        ) : null}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-lg border p-4",
        eventStyles(event.kind, event.status, event.startsAt, event.endsAt),
        past && "opacity-70",
        compactActions ? "" : "px-6 py-4",
      )}
    >
      {content}
    </li>
  );
}

export function TeacherAgendaList({
  events,
  variant = "full",
  showHistory = false,
  showHeader = false,
  headerTitle = "Agenda à venir",
  headerDescription = "Sessions confirmées et créneaux publiés.",
  headerLink,
  onEventClick,
  renderEventActions,
  loading = false,
}: TeacherAgendaListProps) {
  const sourceEvents = showHistory ? events : getUpcomingEvents(events);
  const confirmed = sourceEvents.filter(isConfirmedSession);
  const openSlots = sourceEvents.filter(
    (event) => event.kind === "slot_available",
  );
  const confirmedSlice =
    variant === "compact" ? confirmed.slice(0, 8) : confirmed;
  const openSlotsSlice =
    variant === "compact" ? openSlots.slice(0, 5) : openSlots;

  const body =
    loading ? (
      <ListSkeleton />
    ) : confirmedSlice.length === 0 && openSlotsSlice.length === 0 ? (
      <p className="py-8 text-center text-sm text-ink-600">
        Aucune session ou créneau à venir.
      </p>
    ) : (
      <div className={variant === "compact" ? "divide-y divide-line" : "space-y-6"}>
        {confirmedSlice.length > 0 ? (
          <div>
            {variant === "full" ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                Sessions confirmées ({confirmed.length})
              </p>
            ) : null}
            <ul className={variant === "full" ? "space-y-3" : undefined}>
              {confirmedSlice.map((event) => (
                <AgendaListItem
                  key={event.id}
                  event={event}
                  onEventClick={onEventClick}
                  renderEventActions={renderEventActions}
                  compactActions={variant === "compact"}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {openSlotsSlice.length > 0 ? (
          <div className={variant === "compact" ? "bg-paper/80 px-6 py-4" : undefined}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Créneaux ouverts ({openSlots.length})
            </p>
            <ul className={variant === "full" ? "space-y-3" : "mt-3 space-y-2"}>
              {openSlotsSlice.map((event) => (
                <AgendaListItem
                  key={event.id}
                  event={event}
                  onEventClick={onEventClick}
                  renderEventActions={renderEventActions}
                  compactActions={variant === "compact"}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );

  if (!showHeader) {
    return body;
  }

  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h3 className="font-semibold text-ink-900">{headerTitle}</h3>
          <p className="mt-0.5 text-sm text-ink-600">{headerDescription}</p>
        </div>
        {headerLink ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={headerLink.to}>{headerLink.label}</Link>
          </Button>
        ) : null}
      </div>
      <div className={variant === "compact" ? undefined : "p-0"}>{body}</div>
    </section>
  );
}
