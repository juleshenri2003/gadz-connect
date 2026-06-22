import { Button } from "@gadz-connect/ui";
import { FileText, Mail } from "lucide-react";
import { formatEuro } from "@/features/admin/format";
import {
  invoiceTypeLabel,
  useOpenAdminInvoicePdf,
  useResendParentInvoice,
  useAdminTransactionInvoices,
} from "./useInvoices";

interface TransactionInvoicesPanelProps {
  transactionId: string;
  stripeStatus: string;
  parentName?: string;
  profName?: string;
}

export function TransactionInvoicesPanel({
  transactionId,
  stripeStatus,
  parentName,
  profName,
}: TransactionInvoicesPanelProps) {
  const { data: invoices, isLoading, isError } =
    useAdminTransactionInvoices(transactionId);
  const openPdf = useOpenAdminInvoicePdf();
  const resendParent = useResendParentInvoice();

  if (stripeStatus !== "succeeded") return null;

  const contextParent = invoices?.[0]?.parent_name ?? parentName;
  const contextProf = invoices?.[0]?.prof_name ?? profName;

  return (
    <div className="space-y-3 border-t border-line pt-5">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Factures</h3>
        <p className="mt-1 text-xs text-ink-600">
          Dossier :{" "}
          {contextParent && contextProf
            ? `${contextParent} ↔ ${contextProf}`
            : "générées après encaissement Stripe"}
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
          Aucune facture enregistrée pour cette transaction.
        </p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="rounded-lg border border-line bg-paper/80 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {invoiceTypeLabel(invoice.invoice_type)}
                  </p>
                  <p className="text-xs text-ink-600">
                    {invoice.invoice_number} · {formatEuro(invoice.amount)}
                  </p>
                  {invoice.invoice_type === "parent" ? (
                    <p className="mt-1 text-xs text-ink-500">
                      {invoice.parent_email_sent_at
                        ? `E-mail envoyé le ${new Date(invoice.parent_email_sent_at).toLocaleString("fr-FR")}`
                        : "E-mail non envoyé — configurez RESEND_API_KEY ou renvoyez manuellement"}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {invoice.invoice_type === "parent" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={resendParent.isPending}
                      onClick={() => resendParent.mutate(invoice.id)}
                    >
                      <Mail className="mr-1.5 h-4 w-4" aria-hidden />
                      Renvoyer
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={openPdf.isPending}
                    onClick={() => openPdf.mutate(invoice.id)}
                  >
                    <FileText className="mr-1.5 h-4 w-4" aria-hidden />
                    PDF
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {resendParent.isError ? (
        <p className="text-sm text-danger">
          {(resendParent.error as Error).message}
        </p>
      ) : null}
      {resendParent.isSuccess ? (
        <p className="text-sm text-success">Facture parent renvoyée.</p>
      ) : null}
    </div>
  );
}
