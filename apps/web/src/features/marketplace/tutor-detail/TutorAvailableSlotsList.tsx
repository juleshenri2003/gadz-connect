import { Button, cn } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import {
  computeSlotPrice,
  formatSlotRange,
} from "../marketplaceUtils";
import type { TutorSlotView } from "./slotCalendarUtils";

interface TutorAvailableSlotsListProps {
  hourlyRate: number | null;
  slots: TutorSlotView[] | undefined;
  loading?: boolean;
  selectedSlotId?: string | null;
  onSelectSlot?: (slotId: string) => void;
  onBookSlot: (slotId: string) => void;
}

function SlotsListSkeleton() {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-[3.25rem] animate-pulse rounded-lg border border-brand-100 bg-brand-50/60"
        />
      ))}
    </ul>
  );
}

export function TutorAvailableSlotsList({
  hourlyRate,
  slots,
  loading = false,
  selectedSlotId,
  onSelectSlot,
  onBookSlot,
}: TutorAvailableSlotsListProps) {
  const count = slots?.length ?? 0;

  return (
    <section className="overflow-hidden rounded-md border border-brand-100 bg-surface shadow-surface">
      <div className="border-b border-brand-100 bg-brand-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-700">
          Tous les créneaux
        </h2>
        <p className="mt-0.5 text-xs font-medium text-brand-600">
          {loading
            ? "Chargement…"
            : count > 0
              ? `${count} créneau${count > 1 ? "x" : ""} ouvert${count > 1 ? "s" : ""}`
              : "Aucun créneau ouvert"}
        </p>
      </div>

      <div className="max-h-[min(420px,calc(100dvh-13rem))] overflow-y-auto bg-brand-50/30 p-3">
        {!hourlyRate ? (
          <p className="text-sm text-warning">
            Tarif non renseigné — réservation indisponible.
          </p>
        ) : loading ? (
          <SlotsListSkeleton />
        ) : !slots?.length ? (
          <p className="text-sm text-ink-600">
            Aucun créneau ouvert pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {slots.map((slot) => {
              const price = computeSlotPrice(
                hourlyRate,
                slot.starts_at,
                slot.ends_at,
              );
              const isSelected = selectedSlotId === slot.id;

              return (
                <li key={slot.id}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition",
                      isSelected
                        ? "border-brand-600 bg-brand-100 shadow-surface ring-1 ring-brand-100"
                        : "border-brand-600/25 bg-brand-50 hover:border-brand-600/50 hover:bg-brand-100",
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelectSlot?.(slot.id)}
                    >
                      <p className="text-sm font-semibold leading-snug text-brand-700">
                        {formatSlotRange(slot.starts_at, slot.ends_at)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-brand-700">
                        {formatEuro(price)}
                      </p>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
