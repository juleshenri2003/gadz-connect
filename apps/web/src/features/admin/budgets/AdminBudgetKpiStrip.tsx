import { useState } from "react";
import { Button } from "@gadz-connect/ui";
import { StatCard } from "@/features/admin/StatCard";
import { formatEuro } from "@/features/admin/format";
import type { AdminBudgetData } from "@/features/admin/types";

interface AdminBudgetKpiStripProps {
  budget: AdminBudgetData;
}

export function AdminBudgetKpiStrip({ budget }: AdminBudgetKpiStripProps) {
  const [showSecondary, setShowSecondary] = useState(false);
  const { budgets, allTime, periodLabel } = budget;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="green"
          label={`Encaissé net (${periodLabel.toLowerCase()})`}
          value={formatEuro(budgets.encaisseNet)}
          hint={`Brut : ${formatEuro(budgets.encaisseBrut)}`}
        />
        <StatCard
          accent="amber"
          label={`En attente (${periodLabel.toLowerCase()})`}
          value={formatEuro(budgets.enAttenteNet)}
          hint={`Brut : ${formatEuro(budgets.enAttenteBrut)}`}
        />
        <StatCard
          label={`Commissions SASU (${periodLabel.toLowerCase()})`}
          value={formatEuro(budgets.volumeCommissions)}
          hint={`Volume brut : ${formatEuro(budgets.volumeBrut)}`}
        />
        <StatCard
          accent="amber"
          label="URSSAF à déclarer"
          value={formatEuro(budgets.urssafToDeclare)}
          hint={
            budgets.urssafToDeclareCount > 0
              ? `${budgets.urssafToDeclareCount} transaction(s) encaissée(s)`
              : "Aucune déclaration en attente"
          }
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-400">
          {budget.transactionsTotal} transaction(s) sur la période · Cumul net
          encaissé : {formatEuro(allTime.encaisseNet)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowSecondary((value) => !value)}
        >
          {showSecondary ? "Masquer le détail" : "Voir le détail"}
        </Button>
      </div>

      {showSecondary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Cotisations URSSAF"
            value={formatEuro(budgets.volumeUrssaf)}
            hint={`Sur ${periodLabel.toLowerCase()}`}
          />
          <StatCard
            label="Net versé (période)"
            value={formatEuro(budgets.volumeNetVerse)}
            hint={`Commissions : ${formatEuro(budgets.volumeCommissions)}`}
          />
          <StatCard
            accent="indigo"
            label="Cumul historique"
            value={formatEuro(allTime.volumeBrut)}
            hint={`Net encaissé : ${formatEuro(allTime.encaisseNet)} · Commissions : ${formatEuro(allTime.volumeCommissions)}`}
          />
        </div>
      ) : null}
    </div>
  );
}
