import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { formatTodayDate } from "@/features/dashboard/admin-cockpit/adminCockpitUtils";
import type { AdminBudgetData } from "@/features/admin/types";

interface AdminBudgetHeaderProps {
  budget: AdminBudgetData;
}

export function AdminBudgetHeader({ budget }: AdminBudgetHeaderProps) {
  const scopeLabel =
    budget.scope === "global"
      ? "Tous les campus Arts et Métiers"
      : "Périmètre limité à votre campus";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Argent</h2>
        <p className="mt-1 text-sm text-ink-600">
          Cockpit cash — facturation, clôture &amp; URSSAF ·{" "}
          {budget.periodLabel.toLowerCase()}
        </p>
        <p className="mt-1 text-xs text-ink-400">
          {scopeLabel}
          {" · "}
          <span className="capitalize">{formatTodayDate()}</span>
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" asChild>
        <Link to="/admin">← Retour au pilotage</Link>
      </Button>
    </div>
  );
}
