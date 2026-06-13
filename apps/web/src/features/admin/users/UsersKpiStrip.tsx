import { cn } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import type { UserPresetFilter } from "./userFilters";

interface UsersKpiStripProps {
  total: number;
  pendingSiret: number;
  verificationFailed: number;
  suspended: number;
  activePreset: UserPresetFilter | null;
  onPresetChange: (preset: UserPresetFilter | null) => void;
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "indigo" | "green" | "amber" | "slate";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md text-left transition ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600",
        active && "ring-2 ring-accent-600",
      )}
    >
      <StatCard label={label} value={value} hint={hint} accent={accent} />
    </button>
  );
}

export function UsersKpiStrip({
  total,
  pendingSiret,
  verificationFailed,
  suspended,
  activePreset,
  onPresetChange,
}: UsersKpiStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total utilisateurs"
        value={total}
        accent="indigo"
        active={activePreset === null}
        onClick={() => onPresetChange(null)}
      />
      <KpiCard
        label="En attente SIRET"
        value={pendingSiret}
        accent="amber"
        hint="Dossiers à valider"
        active={activePreset === "pending_siret"}
        onClick={() =>
          onPresetChange(
            activePreset === "pending_siret" ? null : "pending_siret",
          )
        }
      />
      <KpiCard
        label="Vérif. SIRET en échec"
        value={verificationFailed}
        accent="amber"
        active={activePreset === "verification_failed"}
        onClick={() =>
          onPresetChange(
            activePreset === "verification_failed"
              ? null
              : "verification_failed",
          )
        }
      />
      <KpiCard
        label="Suspendus"
        value={suspended}
        accent="slate"
        active={activePreset === "suspended"}
        onClick={() =>
          onPresetChange(activePreset === "suspended" ? null : "suspended")
        }
      />
    </div>
  );
}
