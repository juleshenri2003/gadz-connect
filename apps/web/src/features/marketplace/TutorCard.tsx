import { cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { MarketplaceTutorBase } from "./marketplaceUtils";
import { formatNextSlot } from "./marketplaceUtils";

export function TutorAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 font-display text-sm font-semibold text-brand-700"
      aria-hidden
    >
      {initials}
    </div>
  );
}

interface TutorCardContentProps {
  tutor: MarketplaceTutorBase;
  className?: string;
}

export function TutorCardContent({ tutor, className }: TutorCardContentProps) {
  const name = `${tutor.first_name} ${tutor.last_name}`.trim();
  const slotCount = tutor.available_slot_count ?? 0;
  const hasSlots = slotCount > 0;
  const hasCv = Boolean(tutor.cv?.trim()) || Boolean(tutor.has_cv_pdf);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-md border bg-surface p-5 transition hover:shadow-raised",
        hasSlots
          ? "border-line hover:border-brand-100"
          : "border-line opacity-75 hover:border-line",
        className,
      )}
    >
      <div className="flex flex-1 gap-3">
        <TutorAvatar name={name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-6 items-start justify-between gap-2">
            <p className="font-semibold text-ink-900">{name}</p>
            {hasCv ? (
              <span
                className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success"
                title="CV disponible"
              >
                CV
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-2 line-clamp-2 min-h-10 text-sm leading-snug",
              tutor.bio ? "text-ink-600" : "text-transparent",
            )}
          >
            {tutor.bio || "—"}
          </p>

          <p className="mt-2 text-sm font-medium text-ink-600">
            {tutor.hourly_rate
              ? `${formatEuro(tutor.hourly_rate)} / h`
              : "Tarif à définir"}
          </p>

          {hasSlots ? (
            <p className="mt-2 text-xs font-medium text-success">
              {slotCount} créneau{slotCount > 1 ? "x" : ""} · Prochain :{" "}
              {tutor.next_available_slot_at
                ? formatNextSlot(tutor.next_available_slot_at)
                : "—"}
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-warning">
              Aucun créneau ouvert — voir le profil
            </p>
          )}

          <div className="mt-3 flex min-h-[26px] flex-wrap content-start gap-1.5">
            {tutor.subjects.length > 0
              ? tutor.subjects.slice(0, 4).map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                  >
                    {subject}
                  </span>
                ))
              : null}
            {tutor.subjects.length > 4 ? (
              <span className="text-[11px] text-ink-400">
                +{tutor.subjects.length - 4}
              </span>
            ) : null}
          </div>

          <p className="mt-auto pt-3 text-xs font-medium text-brand-700">
            Voir le profil →
          </p>
        </div>
      </div>
    </div>
  );
}

interface TutorCardProps {
  tutor: MarketplaceTutorBase;
  to: string;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export function TutorCard({ tutor, to, className, onClick }: TutorCardProps) {
  return (
    <Link to={to} className={cn("block h-full no-underline", className)} onClick={onClick}>
      <TutorCardContent tutor={tutor} />
    </Link>
  );
}
