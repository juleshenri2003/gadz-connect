import { Button } from "@gadz-connect/ui";
import { FileText } from "lucide-react";
import {
  invoiceTypeLabel,
  useAdminInvoicePreview,
  type InvoiceType,
} from "./useInvoices";

export function AdminInvoicePreviewPanel() {
  const preview = useAdminInvoicePreview();

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Aperçu des factures</h3>
          <p className="mt-1 text-sm text-ink-600">
            Visualisez le modèle PDF avec le n° SAP configuré — sans paiement
            réel.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PreviewButton
          type="parent"
          label="Facture parent (36 €)"
          loading={preview.isPending && preview.variables === "parent"}
          onClick={() => preview.mutate("parent")}
        />
        <PreviewButton
          type="student"
          label="Facture étudiant (33 €)"
          loading={preview.isPending && preview.variables === "student"}
          onClick={() => preview.mutate("student")}
        />
      </div>

      {preview.isError ? (
        <p className="mt-3 text-sm text-danger">
          {(preview.error as Error).message}
        </p>
      ) : null}
    </section>
  );
}

function PreviewButton({
  type,
  label,
  loading,
  onClick,
}: {
  type: InvoiceType;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={onClick}
      title={invoiceTypeLabel(type)}
    >
      <FileText className="mr-1.5 h-4 w-4" aria-hidden />
      {loading ? "Ouverture…" : label}
    </Button>
  );
}
