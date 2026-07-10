import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { Check, Circle } from "lucide-react";
import type { MarketplaceStatus } from "@/features/marketplace/useTutors";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";

interface TeacherMarketplaceVisibilityProps {
  marketplace: MarketplaceStatus | undefined;
  onFixRate?: () => void;
  onFixSlots?: () => void;
  compact?: boolean;
}

function CheckItem({
  ok,
  label,
  action,
}: {
  ok: boolean;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span
        className={cn(
          "flex items-center gap-2 text-sm",
          ok ? "text-success" : "text-warning",
        )}
      >
        {ok ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Circle className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {label}
      </span>
      {!ok && action ? <span className="shrink-0">{action}</span> : null}
    </li>
  );
}

function BookabilityGauge({ percent }: { percent: number }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-600">Réservabilité</span>
        <span className="tabular-nums font-semibold text-ink-900">{percent}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Jauge de réservabilité"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            percent === 100 ? "bg-success" : "bg-accent-600",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function TeacherMarketplaceVisibility({
  marketplace,
  onFixRate,
  onFixSlots,
  compact = false,
}: TeacherMarketplaceVisibilityProps) {
  if (!marketplace) return null;

  const { checks } = marketplace;
  const checkValues = [
    checks.rate,
    checks.futureSlots,
    checks.stripe,
    checks.profileSetup,
  ];
  const completed = checkValues.filter(Boolean).length;
  const percent = Math.round((completed / checkValues.length) * 100);

  if (marketplace.visible || percent === 100) {
    return null;
  }

  const pendingItems = [
    {
      ok: checks.rate,
      label: "Tarif horaire renseigné",
      action: onFixRate ? (
        <Button size="sm" variant="outline" onClick={onFixRate}>
          Tarif →
        </Button>
      ) : (
        <Button size="sm" variant="outline" asChild>
          <Link to={coursesTabHref("profile")}>Tarif →</Link>
        </Button>
      ),
    },
    {
      ok: checks.futureSlots,
      label: "Au moins un créneau à venir",
      action: onFixSlots ? (
        <Button size="sm" variant="outline" onClick={onFixSlots}>
          Créneaux →
        </Button>
      ) : (
        <Button size="sm" variant="outline" asChild>
          <Link to={coursesTabHref("slots")}>Créneaux →</Link>
        </Button>
      ),
    },
    {
      ok: checks.stripe,
      label: "Paiements Stripe configurés",
      action: (
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/paiements">Stripe →</Link>
        </Button>
      ),
    },
    {
      ok: checks.profileSetup,
      label: "Profil complété",
      action: (
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/setup">Profil →</Link>
        </Button>
      ),
    },
  ].filter((item) => !item.ok);

  if (pendingItems.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning",
        compact && "py-2",
      )}
      role="status"
    >
      <p className="font-medium text-warning">Apparaître aux élèves</p>
      <p className="mt-1 text-warning/90">
        Complétez les étapes ci-dessous pour apparaître dans « Trouver mon tuteur ».
      </p>
      <BookabilityGauge percent={percent} />
      <ul className="mt-3 space-y-2">
        {pendingItems.map((item) => (
          <CheckItem
            key={item.label}
            ok={item.ok}
            label={item.label}
            action={item.action}
          />
        ))}
      </ul>
    </section>
  );
}

export function MarketplaceVisibilityPill({
  marketplace,
}: {
  marketplace: MarketplaceStatus | undefined;
}) {
  if (!marketplace) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        marketplace.visible
          ? "bg-success-bg text-success"
          : "bg-warning-bg text-warning",
      )}
    >
      {marketplace.visible ? "Visible campus" : "Invisible marketplace"}
    </span>
  );
}
