import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type { TeacherFinancialSummary } from "@gadz-connect/types";

function FinancialMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "indigo" | "amber" | "slate";
}) {
  const accentClass =
    accent === "indigo"
      ? "border-brand-100 bg-brand-50/50"
      : accent === "amber"
        ? "border-warning/20 bg-warning-bg/50"
        : "border-line bg-surface";

  return (
    <div className={cn("rounded-md border px-4 py-3", accentClass)}>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-600">{hint}</p> : null}
    </div>
  );
}

interface TeacherFinancialSummaryProps {
  financial: TeacherFinancialSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  compact?: boolean;
  stripeConfigured?: boolean;
}

export function TeacherFinancialSummarySection({
  financial,
  isLoading,
  isError,
  compact = false,
  stripeConfigured = true,
}: TeacherFinancialSummaryProps) {
  if (!stripeConfigured) {
    return (
      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Finances</h3>
        <p className="mt-4 text-sm text-ink-600">
          Vos encaissements apparaîtront ici une fois Stripe Connect activé.
        </p>
      </section>
    );
  }

  if (compact) {
    return (
      <section className="rounded-md border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink-900">Finances</h3>
            <p className="mt-1 text-sm text-ink-600">Pilotage du mois en cours.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/paiements">Détail →</Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-ink-400">Chargement…</p>
        ) : isError || !financial ? (
          <p className="mt-4 text-sm text-danger">
            Impossible de charger les finances.
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-ink-600">
              <span className="text-ink-400">Encaissé ce mois :</span>{" "}
              <span className="font-semibold tabular-nums text-ink-900">
                {formatEuro(financial.month.encaisseNet)}
              </span>
              <span className="text-ink-400"> net</span>
            </p>
            <p className="text-ink-600">
              <span className="text-ink-400">En attente :</span>{" "}
              <span className="font-semibold tabular-nums text-ink-900">
                {formatEuro(financial.month.enAttenteNet)}
              </span>
            </p>
            {financial.urssaf.due && financial.urssaf.amountToDeclare > 0 ? (
              <p className="text-warning">
                URSSAF : {financial.urssaf.undeclaredCount} transaction(s) à
                déclarer
              </p>
            ) : null}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Finances</h3>
        <p className="mt-1 text-sm text-ink-600">Pilotage du mois en cours.</p>

        {isLoading ? (
          <p className="mt-4 text-sm text-ink-400">Chargement…</p>
        ) : isError || !financial ? (
          <p className="mt-4 text-sm text-danger">
            Impossible de charger les finances.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <FinancialMetric
              accent="indigo"
              label="Encaissé ce mois (net)"
              value={formatEuro(financial.month.encaisseNet)}
              hint={`Brut : ${formatEuro(financial.month.encaisseBrut)} · ${financial.month.coursTermines} cours terminés`}
            />
            <FinancialMetric
              accent="amber"
              label="En attente (net)"
              value={formatEuro(financial.month.enAttenteNet)}
              hint={`Brut : ${formatEuro(financial.month.enAttenteBrut)}`}
            />
            <FinancialMetric
              label="Prévisionnel"
              value={formatEuro(financial.forecast.net)}
              hint={`${financial.forecast.count} cours futur(s) · brut ${formatEuro(financial.forecast.brut)}`}
            />
          </div>
        )}

        {financial ? (
          <p className="mt-4 text-xs text-ink-400">
            Cumul net encaissé : {formatEuro(financial.allTime.encaisseNet)}
          </p>
        ) : null}
      </section>

      {financial?.urssaf.due && financial.urssaf.amountToDeclare > 0 ? (
        <section className="rounded-md border border-warning/20 bg-warning-bg p-4 text-sm">
          <p className="font-medium text-warning">Déclaration URSSAF</p>
          <p className="mt-1 text-warning">
            {financial.urssaf.undeclaredCount} transaction(s) à déclarer —{" "}
            {formatEuro(financial.urssaf.amountToDeclare)} net.
          </p>
          <Button className="mt-3" size="sm" variant="outline" asChild>
            <a
              href="https://www.autoentrepreneur.urssaf.fr/portail/accueil.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Espace URSSAF →
            </a>
          </Button>
        </section>
      ) : null}
    </>
  );
}
