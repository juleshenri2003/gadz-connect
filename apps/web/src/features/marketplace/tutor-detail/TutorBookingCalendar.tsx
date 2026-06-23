import { Button, cn } from "@gadz-connect/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import {
  formatDayHeader,
  formatEventTime,
  formatWeekRange,
  getWeekDays,
  isSameDay,
  startOfWeek,
} from "@/features/scheduling/calendar-utils";
import {
  computeSlotPrice,
  formatSlotDuration,
} from "../marketplaceUtils";
import { TutorDayTimeline } from "./TutorDayTimeline";
import {
  addWeeks,
  dayKey,
  getInitialWeekAnchor,
  groupSlotsByDay,
  pickDayInWeek,
  type TutorSlotView,
} from "./slotCalendarUtils";

interface TutorBookingCalendarProps {
  hourlyRate: number | null;
  slots: TutorSlotView[] | undefined;
  loading?: boolean;
  nextAvailableAt?: string | null;
  initialSlotId?: string | null;
  onBookSlot: (slotId: string) => void;
  listBackHref?: string;
}

function BookingCalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <div className="h-5 w-32 animate-pulse rounded bg-paper" />
        <div className="flex gap-2">
          <div className="h-8 w-8 animate-pulse rounded bg-paper" />
          <div className="h-8 w-16 animate-pulse rounded bg-paper" />
          <div className="h-8 w-8 animate-pulse rounded bg-paper" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-12 flex-1 animate-pulse rounded-lg bg-paper"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-paper" />
    </div>
  );
}

function TutorSlotsEmptyState({ listBackHref }: { listBackHref?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Aucun créneau ouvert pour l&apos;instant. Revenez plus tard ou
        consultez un autre professeur.
      </p>
      {listBackHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link to={listBackHref}>Retour à la liste</Link>
        </Button>
      ) : null}
    </div>
  );
}

interface BookingSummaryProps {
  slot: TutorSlotView;
  hourlyRate: number;
  onBook: () => void;
  className?: string;
}

function BookingSummary({
  slot,
  hourlyRate,
  onBook,
  className,
}: BookingSummaryProps) {
  const price = computeSlotPrice(hourlyRate, slot.starts_at, slot.ends_at);
  const duration = formatSlotDuration(slot.starts_at, slot.ends_at);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3",
        className,
      )}
    >
      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <div>
          <dt className="sr-only">Horaire</dt>
          <dd className="font-medium text-ink-900">
            {formatEventTime(slot.starts_at, slot.ends_at)}
          </dd>
        </div>
        <div className="hidden h-4 w-px bg-line sm:block" aria-hidden />
        <div>
          <dt className="sr-only">Durée</dt>
          <dd className="text-ink-600">{duration}</dd>
        </div>
        <div className="hidden h-4 w-px bg-line sm:block" aria-hidden />
        <div>
          <dt className="sr-only">Prix</dt>
          <dd className="font-medium text-ink-900">{formatEuro(price)}</dd>
        </div>
      </dl>
      <Button size="sm" onClick={onBook}>
        Réserver ce créneau
      </Button>
    </div>
  );
}

export function TutorBookingCalendar({
  hourlyRate,
  slots,
  loading = false,
  nextAvailableAt,
  initialSlotId,
  onBookSlot,
  listBackHref,
}: TutorBookingCalendarProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const initializedRef = useRef(false);
  const slotsByDay = useMemo(() => groupSlotsByDay(slots ?? []), [slots]);

  const [weekAnchor, setWeekAnchor] = useState(() =>
    getInitialWeekAnchor(slots, nextAvailableAt),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const today = useMemo(() => new Date(), []);

  const selectedSlot = useMemo(
    () => slots?.find((slot) => slot.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return slotsByDay.get(dayKey(selectedDay)) ?? [];
  }, [selectedDay, slotsByDay]);

  const weekDaysWithSlots = useMemo(
    () => weekDays.filter((day) => slotsByDay.has(dayKey(day))),
    [weekDays, slotsByDay],
  );

  function applyWeekSelection(anchor: Date, preferredDay?: Date) {
    const picked = pickDayInWeek(anchor, slotsByDay, preferredDay);
    if (picked) {
      setSelectedDay(picked.day);
      setSelectedSlotId(picked.slotId);
    } else {
      setSelectedDay(null);
      setSelectedSlotId(null);
    }
  }

  useEffect(() => {
    if (!slots?.length || initializedRef.current) return;
    initializedRef.current = true;

    const anchor = getInitialWeekAnchor(slots, nextAvailableAt);
    setWeekAnchor(anchor);

    const targetSlot = initialSlotId
      ? slots.find((s) => s.id === initialSlotId)
      : slots[0];
    if (!targetSlot) return;

    const slotDay = new Date(targetSlot.starts_at);
    const picked = pickDayInWeek(anchor, slotsByDay, slotDay);
    if (picked) {
      setSelectedDay(picked.day);
      setSelectedSlotId(
        initialSlotId && slots.some((s) => s.id === initialSlotId)
          ? initialSlotId
          : picked.slotId,
      );
    }

    if (initialSlotId) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [slots, nextAvailableAt, initialSlotId]);

  function handleSelectDay(day: Date) {
    const key = dayKey(day);
    if (!slotsByDay.has(key)) return;
    setSelectedDay(day);
    const firstSlot = slotsByDay.get(key)?.[0];
    setSelectedSlotId(firstSlot?.id ?? null);
  }

  function handleSelectSlot(slotId: string) {
    setSelectedSlotId(slotId);
  }

  function handleBook() {
    if (selectedSlotId) onBookSlot(selectedSlotId);
  }

  function goToWeek(anchor: Date) {
    const normalized = startOfWeek(anchor);
    setWeekAnchor(normalized);
    applyWeekSelection(normalized);
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="tutor-booking-calendar"
        className="rounded-md border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="font-semibold text-ink-900">Choisir un créneau</h2>

        {!hourlyRate ? (
          <p className="mt-2 text-sm text-warning">
            Ce tuteur n&apos;a pas encore défini de tarif.
          </p>
        ) : loading ? (
          <div className="mt-4">
            <BookingCalendarSkeleton />
          </div>
        ) : !slots?.length ? (
          <div className="mt-3">
            <TutorSlotsEmptyState listBackHref={listBackHref} />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink-900">
                {formatWeekRange(weekAnchor)}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Semaine précédente"
                  onClick={() => goToWeek(addWeeks(weekAnchor, -1))}
                >
                  ←
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Semaine suivante"
                  onClick={() => goToWeek(addWeeks(weekAnchor, 1))}
                >
                  →
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const key = dayKey(day);
                const count = slotsByDay.get(key)?.length ?? 0;
                const hasSlots = count > 0;
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isToday = isSameDay(day, today);
                const { weekday, day: dayNum } = formatDayHeader(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={!hasSlots}
                    onClick={() => handleSelectDay(day)}
                    aria-label={`${weekday} ${dayNum}${isToday ? ", aujourd'hui" : ""}${hasSlots ? `, ${count} créneau${count > 1 ? "x" : ""}` : ", indisponible"}`}
                    aria-pressed={Boolean(isSelected)}
                    aria-current={isToday ? "date" : undefined}
                    className={cn(
                      "rounded-lg border py-2 text-center transition",
                      !hasSlots &&
                        "cursor-not-allowed border-transparent opacity-40",
                      hasSlots &&
                        !isSelected &&
                        "border-line bg-paper/80 hover:border-brand-100",
                      hasSlots &&
                        isSelected &&
                        "border-brand-600 bg-brand-50 ring-1 ring-brand-100",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-medium leading-tight",
                        isToday
                          ? "normal-case text-ink-600"
                          : "uppercase text-ink-400",
                      )}
                    >
                      {isToday ? "aujourd'hui" : weekday}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isSelected ? "text-brand-700" : "text-ink-900",
                      )}
                    >
                      {dayNum}
                    </p>
                    {!isToday && hasSlots ? (
                      <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-success" />
                    ) : (
                      <span className="mt-1 block h-1" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            {weekDaysWithSlots.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">
                Aucun créneau cette semaine — parcourez les semaines suivantes
              </p>
            ) : selectedDay ? (
              <TutorDayTimeline
                slots={daySlots}
                selectedSlotId={selectedSlotId}
                onSelectSlot={handleSelectSlot}
                onBookSlot={onBookSlot}
              />
            ) : null}

            {selectedSlot && hourlyRate ? (
              <BookingSummary
                slot={selectedSlot}
                hourlyRate={hourlyRate}
                onBook={handleBook}
                className="hidden sm:flex"
              />
            ) : null}
          </div>
        )}
      </section>

      {selectedSlot && hourlyRate ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface p-4 shadow-raised sm:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-ink-900">
                {formatEventTime(selectedSlot.starts_at, selectedSlot.ends_at)}
              </p>
              <p className="text-xs text-ink-600">
                {formatSlotDuration(selectedSlot.starts_at, selectedSlot.ends_at)}{" "}
                ·{" "}
                {formatEuro(
                  computeSlotPrice(
                    hourlyRate,
                    selectedSlot.starts_at,
                    selectedSlot.ends_at,
                  ),
                )}
              </p>
            </div>
            <Button size="sm" className="shrink-0" onClick={handleBook}>
              Réserver
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
