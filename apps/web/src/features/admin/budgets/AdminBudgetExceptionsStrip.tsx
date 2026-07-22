import { cn } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type { AdminBudgetData } from "@/features/admin/types";
import type { BudgetWorkspaceTab } from "./budgetFilters";

export interface BudgetExceptionItem {
  id: string;
  label: string;
  hint: string;
  count: number;
  amount?: number;
  tone: "amber" | "danger" | "violet";
  tab?: BudgetWorkspaceTab;
  statusStripe?: string;
}

interface AdminBudgetExceptionsStripProps {
  budget: AdminBudgetData;
  urssafAnomaliesCount: number | null;
  missingInvoiceHint?: number;
  onSelect: (item: BudgetExceptionItem) => void;
}

export function buildBudgetExceptions(
  budget: AdminBudgetData,
  urssafAnomaliesCount: number | null,
  missingInvoiceHint = 0,
): BudgetExceptionItem[] {
  const failed = budget.byStripeStatus.failed;
  const pending = budget.byStripeStatus.pending;
  const items: BudgetExceptionItem[] = [];

  if (failed && failed.count > 0) {
    items.push({
      id: "stripe-failed",
      label: "Paiements Stripe en échec",
      hint: "À investiguer ou rembourser",
      count: failed.count,
      amount: failed.amountGross,
      tone: "danger",
      tab: "facturation",
      statusStripe: "failed",
    });
  }

  if (pending && pending.count > 0) {
    items.push({
      id: "stripe-pending",
      label: "Paiements en attente",
      hint: "Non encore encaissés",
      count: pending.count,
      amount: pending.amountGross,
      tone: "amber",
      tab: "cloture",
      statusStripe: "pending",
    });
  }

  if (urssafAnomaliesCount != null && urssafAnomaliesCount > 0) {
    items.push({
      id: "urssaf",
      label: "Anomalies URSSAF",
      hint: "Reversement / demande / rejet",
      count: urssafAnomaliesCount,
      tone: "violet",
      tab: "cloture",
    });
  }

  if (missingInvoiceHint > 0) {
    items.push({
      id: "invoices",
      label: "Factures à compléter",
      hint: "Sessions encaissées sans PDF",
      count: missingInvoiceHint,
      tone: "amber",
      tab: "facturation",
    });
  }

  if (budget.budgets.urssafToDeclareCount > 0) {
    items.push({
      id: "urssaf-declare",
      label: "URSSAF à déclarer",
      hint: formatEuro(budget.budgets.urssafToDeclare),
      count: budget.budgets.urssafToDeclareCount,
      amount: budget.budgets.urssafToDeclare,
      tone: "amber",
      tab: "cloture",
    });
  }

  return items;
}

const TONE_CLASSES = {
  amber: "border-warning/40 bg-warning-bg/50 text-warning",
  danger: "border-danger/30 bg-danger-bg text-danger",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
} as const;

export function AdminBudgetExceptionsStrip({
  budget,
  urssafAnomaliesCount,
  missingInvoiceHint = 0,
  onSelect,
}: AdminBudgetExceptionsStripProps) {
  const items = buildBudgetExceptions(
    budget,
    urssafAnomaliesCount,
    missingInvoiceHint,
  );

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-success/30 bg-success-bg/40 px-4 py-3 text-sm text-success">
        Aucune exception argent sur cette période — cash et conformité OK.
      </div>
    );
  }

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">
          Exceptions à traiter
        </h3>
        <p className="text-xs text-ink-500">
          File argent — cliquez pour ouvrir l&apos;espace concerné
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "rounded-md border px-3 py-3 text-left transition hover:opacity-90",
              TONE_CLASSES[item.tone],
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{item.label}</p>
              <span className="text-lg font-bold tabular-nums">{item.count}</span>
            </div>
            <p className="mt-0.5 text-xs opacity-80">{item.hint}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
