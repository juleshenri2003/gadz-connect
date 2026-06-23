import { Button } from "@gadz-connect/ui";
import { FileText } from "lucide-react";
import { formatEuro } from "@/features/admin/format";
import {
  useOpenTeacherInvoiceUrl,
  useTeacherInvoices,
} from "./useInvoices";

export function TeacherInvoicesList() {
  const { data: invoices, isLoading, isError } = useTeacherInvoices();
  const openInvoice = useOpenTeacherInvoiceUrl();

  return (
    <section
      id="factures"
      className="rounded-md border border-line bg-surface p-5 scroll-mt-6"
    >
      <h3 className="font-semibold text-ink-900">Mes factures URSSAF</h3>
      <p className="mt-1 text-sm text-ink-600">
        Notes de débours mensuelles émises par votre auto-entreprise (1er de chaque
        mois).
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="mt-4 text-sm text-danger">
          Impossible de charger les factures.
        </p>
      ) : !invoices?.length ? (
        <p className="mt-4 text-sm text-ink-600">
          Aucune facture pour l&apos;instant. Elles sont générées le 1er de chaque
          mois pour les cours du mois précédent.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {invoices.map((invoice) => {
            const courseLabel =
              invoice.course_subject ||
              invoice.course_title ||
              "Cours de tutorat";
            const date = invoice.scheduled_at
              ? new Date(invoice.scheduled_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : new Date(invoice.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

            return (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">{courseLabel}</p>
                  <p className="mt-0.5 text-ink-600">
                    {invoice.invoice_number} · {date} ·{" "}
                    {formatEuro(invoice.amount)}
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
            );
          })}
        </ul>
      )}
    </section>
  );
}
