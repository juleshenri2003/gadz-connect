import { Link } from "react-router-dom";
import { Button, Skeleton } from "@gadz-connect/ui";
import { TutorAvatar } from "@/features/marketplace/TutorCard";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { formatEuro } from "@/features/admin/format";
import { formatNextSlot } from "@/features/marketplace/marketplaceUtils";
import { useTutors } from "@/features/marketplace/useTutors";

interface StudentTutorsPanelProps {
  tutorCount: number;
}

export function StudentTutorsPanel({ tutorCount }: StudentTutorsPanelProps) {
  const { data: tutors, isLoading, isError } = useTutors();
  const preview = (tutors ?? []).slice(0, 4);

  return (
    <section
      id="trouver-un-tuteur"
      className="scroll-mt-6 rounded-md border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Trouver mon tuteur</h3>
          <p className="mt-1 text-sm text-ink-600">
            Professeurs validés sur votre campus, prêts à réserver.
          </p>
        </div>
        {tutorCount > 0 ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={marketplaceRoutes.list("app")}>Voir tout →</Link>
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="mt-4 text-sm text-danger">
          Impossible de charger les tuteurs.
        </p>
      ) : preview.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-line bg-paper px-3 py-4 text-sm text-ink-500">
          Aucun professeur disponible pour le moment sur votre campus.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {preview.map((tutor) => {
            const name = `${tutor.first_name} ${tutor.last_name}`.trim();
            const href = marketplaceRoutes.detail(tutor.id, "app");
            const subjects = tutor.subjects.slice(0, 2).join(" · ");
            const slotHint = tutor.next_available_slot_at
              ? `Prochain : ${formatNextSlot(tutor.next_available_slot_at)}`
              : tutor.available_slot_count
                ? `${tutor.available_slot_count} créneau${tutor.available_slot_count > 1 ? "x" : ""}`
                : "Voir les disponibilités";

            return (
              <li key={tutor.id}>
                <Link
                  to={href}
                  className="flex items-center gap-3 py-3 transition hover:bg-paper/80"
                >
                  <TutorAvatar name={name} photoUrl={tutor.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {name}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {tutor.hourly_rate
                        ? `${formatEuro(tutor.hourly_rate)}/h`
                        : "Tarif à voir"}
                      {subjects ? ` · ${subjects}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {slotHint}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-brand-700">
                    Profil →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
