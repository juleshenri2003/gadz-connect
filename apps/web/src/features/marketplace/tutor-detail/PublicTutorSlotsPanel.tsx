import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import {
  computeSlotPrice,
  formatSlotRange,
} from "../marketplaceUtils";

export interface TutorSlotView {
  id: string;
  starts_at: string;
  ends_at: string;
}

interface PublicTutorSlotsPanelProps {
  hourlyRate: number | null;
  slots: TutorSlotView[] | undefined;
  onBookSlot: (slotId: string) => void;
  listBackHref?: string;
}

export function PublicTutorSlotsPanel({
  hourlyRate,
  slots,
  onBookSlot,
  listBackHref,
}: PublicTutorSlotsPanelProps) {
  return (
    <section className="rounded-md border border-line bg-surface p-6">
      <h2 className="font-semibold text-ink-900">Créneaux disponibles</h2>
      {!hourlyRate ? (
        <p className="mt-2 text-sm text-warning">
          Ce tuteur n&apos;a pas encore défini de tarif.
        </p>
      ) : !slots?.length ? (
        <div className="mt-3 space-y-3">
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
      ) : (
        <ul className="mt-4 space-y-2">
          {slots.map((slot) => {
            const price = computeSlotPrice(
              hourlyRate,
              slot.starts_at,
              slot.ends_at,
            );
            return (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3"
              >
                <span className="text-sm">
                  {formatSlotRange(slot.starts_at, slot.ends_at)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-600">
                    {formatEuro(price)}
                  </span>
                  <Button size="sm" onClick={() => onBookSlot(slot.id)}>
                    Réserver
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
