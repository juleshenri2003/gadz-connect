import { Button } from "@gadz-connect/ui";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { AdminTransactionRow } from "@/features/admin/types";
import {
  StripeStatusBadge,
  UrssafStatusBadge,
} from "./AdminBudgetStatusBadges";
import { TransactionInvoicesPanel } from "@/features/billing/TransactionInvoicesPanel";
import { formatPersonName, formatTransactionDate } from "./adminBudgetLabels";

interface AdminBudgetTransactionDrawerProps {
  transaction: AdminTransactionRow | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-900">{value}</dd>
    </div>
  );
}

export function AdminBudgetTransactionDrawer({
  transaction,
  onClose,
}: AdminBudgetTransactionDrawerProps) {
  const titleId = useId();
  const open = Boolean(transaction);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !transaction) return null;

  const courseLabel =
    transaction.course.subject ||
    transaction.course.title ||
    "Cours de tutorat";
  const scheduledAt = transaction.course.scheduled_at
    ? new Date(transaction.course.scheduled_at).toLocaleString("fr-FR")
    : "—";

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-raised"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink-900">
              Transaction
            </h2>
            <p className="mt-1 text-sm text-ink-600">{courseLabel}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <StripeStatusBadge status={transaction.status_stripe} />
            {transaction.status_stripe === "succeeded" ? (
              <UrssafStatusBadge status={transaction.status_urssaf} />
            ) : null}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Date de création"
              value={formatTransactionDate(transaction.created_at)}
            />
            <DetailRow label="Cours planifié le" value={scheduledAt} />
            <DetailRow
              label="Professeur"
              value={formatPersonName(transaction.course.provider)}
            />
            <DetailRow
              label="Élève"
              value={formatPersonName(transaction.course.client)}
            />
            <DetailRow
              label="Campus"
              value={transaction.course.campus?.name ?? "—"}
            />
            <DetailRow label="Montant brut" value={formatEuro(transaction.amount_gross)} />
            <DetailRow
              label="Commission SASU"
              value={formatEuro(transaction.commission_sasu)}
            />
            <DetailRow
              label="Cotisations URSSAF"
              value={formatEuro(transaction.taxes_urssaf)}
            />
            <DetailRow label="Net versé" value={formatEuro(transaction.net_payout)} />
          </dl>

          <TransactionInvoicesPanel
            transactionId={transaction.id}
            stripeStatus={transaction.status_stripe}
          />

          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/admin/cours`}>Voir les cours</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/planning">Ouvrir le planning</Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
