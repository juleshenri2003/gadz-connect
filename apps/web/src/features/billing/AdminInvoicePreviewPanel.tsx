import { Button } from "@gadz-connect/ui";
import { FileText } from "lucide-react";
import {
  invoiceTypeLabel,
  useAdminInvoicePreview,
  type InvoiceType,
} from "./useInvoices";

interface AdminInvoicePreviewPanelProps {
  embedded?: boolean;
  /** Limite l'aperçu à un seul type (rubrique prof ou parents). */
  variant?: InvoiceType;
}

export function AdminInvoicePreviewPanel({
  embedded = false,
  variant,
}: AdminInvoicePreviewPanelProps) {
  const preview = useAdminInvoicePreview();

  const showParent = !variant || variant === "parent";
  const showStudent = !variant || variant === "student";

  const content = (
    <>
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink-900">Aperçu des factures</h3>
            <p className="mt-1 text-sm text-ink-600">
              Visualisez le modèle PDF avec le n° SAP configuré — sans paiement
              réel.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-600">
          Modèle de démonstration (montants fictifs).
        </p>
      )}

      <div
        className={
          embedded ? "mt-3 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"
        }
      >
        {showParent ? (
          <PreviewButton
            type="parent"
            label="Facture parent (36 € TTC)"
            loading={preview.isPending && preview.variables === "parent"}
            onClick={() => preview.mutate("parent")}
          />
        ) : null}
        {showStudent ? (
          <PreviewButton
            type="student"
            label="Facture prof URSSAF (33 € HT)"
            loading={preview.isPending && preview.variables === "student"}
            onClick={() => preview.mutate("student")}
          />
        ) : null}
      </div>

      {preview.isError ? (
        <p className="mt-3 text-sm text-danger">
          {(preview.error as Error).message}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      {content}
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
