import { Button } from "@gadz-connect/ui";
import { FileText } from "lucide-react";
import { formatEuro } from "@/features/admin/format";
import {
  invoiceTypeLabel,
  useOpenAdminInvoiceUrl,
  useAdminTransactionInvoices,
} from "./useInvoices";

interface TransactionInvoicesPanelProps {
  transactionId: string;
  stripeStatus: string;
}

export function TransactionInvoicesPanel({
  transactionId,
  stripeStatus,
}: TransactionInvoicesPanelProps) {
  const { data: invoices, isLoading, isError } =
    useAdminTransactionInvoices(transactionId);
  const openInvoice = useOpenAdminInvoiceUrl();

  if (stripeStatus !== "succeeded") return null;

  return (
    <div className="space-y-3 border-t border-line pt-5">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Factures</h3>
        <p className="mt-1 text-xs text-ink-600">
          Générées automatiquement après encaissement Stripe.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement des factures…</p>
      ) : isError ? (
        <p className="text-sm text-danger">
          Impossible de charger les factures.
        </p>
      ) : !invoices?.length ? (
        <p className="text-sm text-ink-600">
          Aucune facture enregistrée pour cette transaction. Appliquez la
          migration 015 et effectuez un paiement test, ou utilisez l&apos;aperçu
          démo ci-dessus.
        </p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/80 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">
                  {invoiceTypeLabel(invoice.invoice_type)}
                </p>
                <p className="text-xs text-ink-600">
                  {invoice.invoice_number} · {formatEuro(invoice.amount)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={openInvoice.isPending}
                onClick={() => openInvoice.mutate(invoice.id)}
              >
                <FileText className="mr-1.5 h-4 w-4" aria-hidden />
                Voir PDF
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
