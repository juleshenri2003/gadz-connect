import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { MarketplaceTutorBase } from "../marketplaceUtils";

interface TutorProfileHeaderProps {
  tutor: MarketplaceTutorBase & { campus?: { name: string } | null };
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function TutorProfileHeader({
  tutor,
  backHref,
  backLabel = "← Tous les tuteurs",
  actions,
}: TutorProfileHeaderProps) {
  const name = `${tutor.first_name} ${tutor.last_name}`.trim();

  return (
    <div>
      <Link to={backHref} className="text-sm text-ink-400 hover:text-ink-900">
        {backLabel}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{name}</h1>
          <p className="mt-1 text-sm text-ink-600">
            {tutor.campus?.name ? `${tutor.campus.name} — ` : null}
            {tutor.hourly_rate
              ? `${formatEuro(tutor.hourly_rate)} / heure`
              : "Tarif non renseigné"}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}
