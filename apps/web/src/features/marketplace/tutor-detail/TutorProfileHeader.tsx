import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { MarketplaceTutorBase } from "../marketplaceUtils";
import { formatNextSlot } from "../marketplaceUtils";

interface TutorProfileHeaderProps {
  tutor: MarketplaceTutorBase & { campus?: { name: string } | null };
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  showSubjects?: boolean;
}

export function TutorProfileHeader({
  tutor,
  backHref,
  backLabel = "← Tous les tuteurs",
  actions,
  showSubjects = true,
}: TutorProfileHeaderProps) {
  const name = `${tutor.first_name} ${tutor.last_name}`.trim();
  const slotCount = tutor.available_slot_count ?? 0;
  const hasSlots = slotCount > 0;

  return (
    <div>
      <Link to={backHref} className="text-sm text-ink-400 hover:text-ink-900">
        {backLabel}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink-900">{name}</h1>
          <p className="mt-1 text-sm text-ink-600">
            {tutor.campus?.name ? `${tutor.campus.name} — ` : null}
            {tutor.hourly_rate
              ? `${formatEuro(tutor.hourly_rate)} / heure`
              : "Tarif non renseigné"}
          </p>
          {hasSlots ? (
            <p className="mt-1 text-xs font-medium text-success">
              {slotCount} créneau{slotCount > 1 ? "x" : ""} disponible
              {slotCount > 1 ? "s" : ""}
              {tutor.next_available_slot_at
                ? ` · Prochain : ${formatNextSlot(tutor.next_available_slot_at)}`
                : null}
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-warning">
              Aucun créneau ouvert pour l&apos;instant
            </p>
          )}
          {showSubjects && tutor.subjects.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tutor.subjects.slice(0, 4).map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                >
                  {subject}
                </span>
              ))}
              {tutor.subjects.length > 4 ? (
                <span className="text-[11px] text-ink-400">
                  +{tutor.subjects.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
