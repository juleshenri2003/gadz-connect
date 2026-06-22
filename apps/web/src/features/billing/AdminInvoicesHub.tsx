import { Button, cn } from "@gadz-connect/ui";
import { FileText, Mail, MailCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { formatEuro } from "@/features/admin/format";
import type { BudgetFiltersState } from "@/features/admin/budgets/budgetFilters";
import {
  invoiceTypeLabel,
  useAdminInvoices,
  useOpenAdminInvoicePdf,
  useResendParentInvoice,
  type AdminInvoiceRow,
} from "./useInvoices";
import { AdminInvoicePreviewPanel } from "./AdminInvoicePreviewPanel";

interface AdminInvoicesHubProps {
  filters: BudgetFiltersState;
}

interface InvoiceDossier {
  transactionId: string;
  parentInvoice?: AdminInvoiceRow;
  studentInvoice?: AdminInvoiceRow;
  context: AdminInvoiceRow;
}

function groupInvoiceDossiers(invoices: AdminInvoiceRow[]): InvoiceDossier[] {
  const byTx = new Map<string, InvoiceDossier>();

  for (const invoice of invoices) {
    let dossier = byTx.get(invoice.transaction_id);
    if (!dossier) {
      dossier = { transactionId: invoice.transaction_id, context: invoice };
      byTx.set(invoice.transaction_id, dossier);
    }
    if (invoice.invoice_type === "parent") {
      dossier.parentInvoice = invoice;
    } else {
      dossier.studentInvoice = invoice;
    }
  }

  return [...byTx.values()];
}

function formatCourseDate(iso: string | null, fallback: string): string {
  if (!iso) {
    return new Date(fallback).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmailStatusBadge({
  invoice,
}: {
  invoice: AdminInvoiceRow | undefined;
}) {
  if (!invoice) return null;
  if (invoice.invoice_type !== "parent") return null;

  if (invoice.parent_email_sent_at) {
    const sentAt = new Date(invoice.parent_email_sent_at).toLocaleString(
      "fr-FR",
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
        <MailCheck className="h-3.5 w-3.5" aria-hidden />
        E-mail envoyé · {sentAt}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
      <Mail className="h-3.5 w-3.5" aria-hidden />
      E-mail non envoyé
    </span>
  );
}

function InvoiceActionRow({
  invoice,
  onOpen,
  onResend,
  opening,
  resending,
}: {
  invoice: AdminInvoiceRow;
  onOpen: (id: string) => void;
  onResend: (id: string) => void;
  opening: boolean;
  resending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">
          {invoiceTypeLabel(invoice.invoice_type)}
        </p>
        <p className="text-xs text-ink-600">
          {invoice.invoice_number} · {formatEuro(invoice.amount)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {invoice.invoice_type === "parent" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resending}
            onClick={() => onResend(invoice.id)}
          >
            <Mail className="mr-1.5 h-4 w-4" aria-hidden />
            {resending ? "Envoi…" : "Renvoyer"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={opening}
          onClick={() => onOpen(invoice.id)}
        >
          <FileText className="mr-1.5 h-4 w-4" aria-hidden />
          Voir PDF
        </Button>
      </div>
    </div>
  );
}

export function AdminInvoicesHub({
  filters,
}: AdminInvoicesHubProps) {
  const [invoiceType, setInvoiceType] = useState<"all" | "parent" | "student">(
    "all",
  );
  const [emailStatus, setEmailStatus] = useState<"all" | "sent" | "not_sent">(
    "all",
  );

  const { data, isLoading, isError, refetch } = useAdminInvoices({
    period: filters.period,
    campusId: filters.campusId !== "all" ? filters.campusId : undefined,
    search: filters.search.trim() || undefined,
    invoiceType: invoiceType === "all" ? undefined : invoiceType,
    emailStatus: emailStatus === "all" ? undefined : emailStatus,
  });

  const openPdf = useOpenAdminInvoicePdf();
  const resendParent = useResendParentInvoice();

  const dossiers = useMemo(
    () => groupInvoiceDossiers(data?.invoices ?? []),
    [data?.invoices],
  );

  return (
    <section className="space-y-4 rounded-md border border-line bg-surface p-5">
      <div>
        <h3 className="font-semibold text-ink-900">Centre de facturation</h3>
        <p className="mt-1 text-sm text-ink-600">
          Un dossier par cours payé — facture parent (SAP) et facture étudiant
          (URSSAF) regroupées avec le contexte complet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "parent", "student"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={invoiceType === value ? "default" : "outline"}
            onClick={() => setInvoiceType(value)}
          >
            {value === "all"
              ? "Toutes"
              : value === "parent"
                ? "Parents"
                : "Étudiants"}
          </Button>
        ))}
        {(["all", "sent", "not_sent"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={emailStatus === value ? "default" : "outline"}
            onClick={() => setEmailStatus(value)}
          >
            {value === "all"
              ? "Tous e-mails"
              : value === "sent"
                ? "E-mail envoyé"
                : "E-mail manquant"}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void refetch()}
        >
          Actualiser
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement des factures…</p>
      ) : isError ? (
        <p className="text-sm text-danger">
          Impossible de charger les factures. Vérifiez la migration 015.
        </p>
      ) : dossiers.length === 0 ? (
        <p className="text-sm text-ink-600">
          Aucune facture sur la période — elles apparaissent après un paiement
          Stripe confirmé.
        </p>
      ) : (
        <ul className="space-y-4">
          {dossiers.map((dossier) => {
            const { context } = dossier;
            const courseDate = formatCourseDate(
              context.scheduled_at,
              context.created_at,
            );

            return (
              <li
                key={dossier.transactionId}
                className="rounded-lg border border-line bg-paper/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-ink-900">
                      {context.course_subject}
                    </p>
                    <p className="text-sm text-ink-600">{courseDate}</p>
                    <p className="text-sm text-ink-600">
                      <span className="font-medium text-ink-800">Parent :</span>{" "}
                      {context.parent_name}
                      <span className="mx-2 text-ink-300" aria-hidden>
                        ·
                      </span>
                      <span className="font-medium text-ink-800">Prof :</span>{" "}
                      {context.prof_name}
                      {context.campus_name ? (
                        <>
                          <span className="mx-2 text-ink-300" aria-hidden>
                            ·
                          </span>
                          {context.campus_name}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <EmailStatusBadge invoice={dossier.parentInvoice} />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {dossier.parentInvoice ? (
                    <InvoiceActionRow
                      invoice={dossier.parentInvoice}
                      onOpen={(id) => openPdf.mutate(id)}
                      onResend={(id) => resendParent.mutate(id)}
                      opening={openPdf.isPending}
                      resending={resendParent.isPending}
                    />
                  ) : null}
                  {dossier.studentInvoice ? (
                    <InvoiceActionRow
                      invoice={dossier.studentInvoice}
                      onOpen={(id) => openPdf.mutate(id)}
                      onResend={() => {}}
                      opening={openPdf.isPending}
                      resending={false}
                    />
                  ) : null}
                </div>

                {resendParent.isError ? (
                  <p className="mt-2 text-sm text-danger">
                    {(resendParent.error as Error).message}
                  </p>
                ) : null}
                {resendParent.isSuccess ? (
                  <p className="mt-2 text-sm text-success">
                    Facture parent renvoyée par e-mail.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {data?.meta ? (
        <p className="text-xs text-ink-400">
          {data.meta.total} facture{data.meta.total > 1 ? "s" : ""} · page{" "}
          {data.meta.page}
        </p>
      ) : null}

      <details className="rounded-lg border border-line bg-paper/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink-900">
          Aperçu des modèles PDF (démo)
        </summary>
        <div className="border-t border-line px-4 pb-4 pt-3">
          <AdminInvoicePreviewPanel embedded />
        </div>
      </details>
    </section>
  );
}

export function TransactionInvoiceBadges({
  statusStripe,
  invoiceSummary,
}: {
  statusStripe: string;
  invoiceSummary?: {
    invoice_count: number;
    parent_email_sent: boolean;
  };
}) {
  if (statusStripe !== "succeeded" || !invoiceSummary?.invoice_count) {
    return null;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          "bg-brand-50 text-brand-700",
        )}
      >
        {invoiceSummary.invoice_count} facture
        {invoiceSummary.invoice_count > 1 ? "s" : ""}
      </span>
      {invoiceSummary.parent_email_sent ? (
        <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
          E-mail OK
        </span>
      ) : (
        <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
          E-mail à envoyer
        </span>
      )}
    </span>
  );
}
