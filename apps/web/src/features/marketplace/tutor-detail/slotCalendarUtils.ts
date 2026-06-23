import {
  getWeekDays,
  isSameDay,
  startOfWeek,
} from "@/features/scheduling/calendar-utils";

export interface TutorSlotView {
  id: string;
  starts_at: string;
  ends_at: string;
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function groupSlotsByDay(
  slots: TutorSlotView[],
): Map<string, TutorSlotView[]> {
  const map = new Map<string, TutorSlotView[]>();
  const seen = new Set<string>();

  for (const slot of slots) {
    if (seen.has(slot.id)) continue;
    seen.add(slot.id);
    const key = dayKey(new Date(slot.starts_at));
    const existing = map.get(key) ?? [];
    existing.push(slot);
    map.set(key, existing);
  }

  for (const [key, daySlots] of map) {
    daySlots.sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
    map.set(key, daySlots);
  }

  return map;
}

export function getInitialWeekAnchor(
  slots: TutorSlotView[] | undefined,
  nextAvailableAt: string | null | undefined,
): Date {
  if (slots?.length) {
    return startOfWeek(new Date(slots[0]!.starts_at));
  }
  if (nextAvailableAt) {
    return startOfWeek(new Date(nextAvailableAt));
  }
  return startOfWeek(new Date());
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function pickDayInWeek(
  anchor: Date,
  slotsByDay: Map<string, TutorSlotView[]>,
  preferredDay?: Date,
): { day: Date; slotId: string } | null {
  const days = getWeekDays(startOfWeek(anchor));
  const withSlots = days.filter((d) => slotsByDay.has(dayKey(d)));

  if (preferredDay) {
    const preferred = withSlots.find((d) => isSameDay(d, preferredDay));
    if (preferred) {
      const slotId = slotsByDay.get(dayKey(preferred))?.[0]?.id;
      if (slotId) return { day: preferred, slotId };
    }
  }

  const first = withSlots[0];
  if (!first) return null;
  const slotId = slotsByDay.get(dayKey(first))?.[0]?.id;
  if (!slotId) return null;
  return { day: first, slotId };
}
