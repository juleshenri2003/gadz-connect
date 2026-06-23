import type { TutorSlotView } from "./slotCalendarUtils";

/** ~42 px × 24 h — journée complète scrollable */
export const TIMELINE_PX_PER_HOUR = 42;

/** Fenêtre par défaut : 7h30 → 20h30 */
export const TIMELINE_VIEW_START = 7.5;
export const TIMELINE_VIEW_END = 20.5;

export interface TimelineBounds {
  startHour: number;
  endHour: number;
}

export interface TimelineConfig {
  bounds: TimelineBounds;
  /** false = journée figée 7h30–20h30 ; true = minuit → minuit scrollable */
  scrollable: boolean;
}

export interface SlotTimelineLayout {
  slot: TutorSlotView;
  top: number;
  height: number;
  column: number;
  columnCount: number;
}

function slotHourFraction(iso: string): number {
  const date = new Date(iso);
  return date.getHours() + date.getMinutes() / 60;
}

function hasSlotsOutsideDefaultWindow(slots: TutorSlotView[]): boolean {
  for (const slot of slots) {
    const startH = slotHourFraction(slot.starts_at);
    const endH = slotHourFraction(slot.ends_at);
    if (startH < TIMELINE_VIEW_START || endH > TIMELINE_VIEW_END) {
      return true;
    }
  }
  return false;
}

/** Plage adaptative : figée si tous les créneaux tiennent dans 7h30–20h30. */
export function getTimelineConfig(slots: TutorSlotView[]): TimelineConfig {
  if (hasSlotsOutsideDefaultWindow(slots)) {
    return {
      bounds: { startHour: 0, endHour: 24 },
      scrollable: true,
    };
  }
  return {
    bounds: { startHour: TIMELINE_VIEW_START, endHour: TIMELINE_VIEW_END },
    scrollable: false,
  };
}

export function timelineHeight(bounds: TimelineBounds): number {
  return (bounds.endHour - bounds.startHour) * TIMELINE_PX_PER_HOUR;
}

export function timelineViewportHeight(): number {
  return (TIMELINE_VIEW_END - TIMELINE_VIEW_START) * TIMELINE_PX_PER_HOUR;
}

/** Marge au-dessus du premier créneau quand il est avant 7h30 (~45 min). */
const EARLY_SLOT_SCROLL_PADDING_HOURS = 0.75;

export function timelineDefaultScrollTop(
  slots: TutorSlotView[],
  bounds: TimelineBounds,
): number {
  const isFullDay = bounds.startHour === 0 && bounds.endHour === 24;
  if (!isFullDay || slots.length === 0) {
    return 0;
  }

  const earliestStart = Math.min(
    ...slots.map((slot) => slotHourFraction(slot.starts_at)),
  );

  if (earliestStart >= TIMELINE_VIEW_START) {
    return TIMELINE_VIEW_START * TIMELINE_PX_PER_HOUR;
  }

  const firstSlotTopPx =
    (earliestStart - bounds.startHour) * TIMELINE_PX_PER_HOUR;
  const paddingPx = EARLY_SLOT_SCROLL_PADDING_HOURS * TIMELINE_PX_PER_HOUR;
  return Math.max(0, firstSlotTopPx - paddingPx);
}

/** Lignes horizontales : une par heure (y compris bornes fractionnaires). */
export function timelineGridHours(bounds: TimelineBounds): number[] {
  const start = Math.floor(bounds.startHour);
  const end = Math.ceil(bounds.endHour);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

/** Labels affichés toutes les 2 h ; minuit en bas si journée complète. */
export function timelineLabelHours(bounds: TimelineBounds): number[] {
  const labels: number[] = [];
  const first = Math.ceil(bounds.startHour);
  const aligned = first % 2 === 0 ? first : first + 1;
  for (let h = aligned; h < bounds.endHour; h += 2) {
    labels.push(h);
  }
  if (bounds.endHour === 24) {
    labels.push(24);
  }
  return labels;
}

export function slotTimelinePosition(
  slot: TutorSlotView,
  bounds: TimelineBounds,
): { top: number; height: number } {
  const start = new Date(slot.starts_at);
  const end = new Date(slot.ends_at);
  const dayStartMinutes = bounds.startHour * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const top = ((startMinutes - dayStartMinutes) / 60) * TIMELINE_PX_PER_HOUR;
  const height = Math.max(
    30,
    ((endMinutes - startMinutes) / 60) * TIMELINE_PX_PER_HOUR,
  );
  return { top, height };
}

export function layoutDaySlots(
  slots: TutorSlotView[],
  bounds: TimelineBounds,
): SlotTimelineLayout[] {
  const sorted = [...slots].sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  const columns: TutorSlotView[][] = [];

  for (const slot of sorted) {
    const start = new Date(slot.starts_at).getTime();
    let placed = false;

    for (const column of columns) {
      const last = column[column.length - 1];
      if (!last) continue;
      if (new Date(last.ends_at).getTime() <= start) {
        column.push(slot);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([slot]);
    }
  }

  const columnCount = Math.max(columns.length, 1);
  const layouts: SlotTimelineLayout[] = [];

  columns.forEach((column, columnIndex) => {
    for (const slot of column) {
      layouts.push({
        slot,
        column: columnIndex,
        columnCount,
        ...slotTimelinePosition(slot, bounds),
      });
    }
  });

  return layouts;
}

export function formatHourLabel(hour: number): string {
  const normalized = hour === 24 ? 0 : hour;
  return `${String(normalized).padStart(2, "0")} h`;
}

export function labelOffsetTop(hour: number, bounds: TimelineBounds): number {
  return (hour - bounds.startHour) * TIMELINE_PX_PER_HOUR;
}
