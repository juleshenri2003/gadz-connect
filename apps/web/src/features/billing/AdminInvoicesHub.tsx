import { Button, cn } from "@gadz-connect/ui";
import { ChevronDown, FileText, Mail, MailCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { formatEuro } from "@/features/admin/format";
import type { BudgetFiltersState } from "@/features/admin/budgets/budgetFilters";
import {
  useAdminInvoices,
  useOpenAdminInvoicePdf,
  useResendParentInvoice,
  type AdminInvoiceRow,
} from "./useInvoices";
import { AdminInvoicePreviewPanel } from "./AdminInvoicePreviewPanel";

interface AdminInvoicesHubProps {
  filters: BudgetFiltersState;
}

type HubTab = "prof" | "parents";

interface PersonInvoiceGroup {
  key: string;
  personName: string;
  invoices: AdminInvoiceRow[];
  totalAmount: number;
}

function personKey(
  invoice: AdminInvoiceRow,
  tab: HubTab,
): string {
  if (tab === "prof") {
    return invoice.provider_profile_id ?? invoice.prof_name;
  }
  return invoice.client_profile_id ?? invoice.parent_name;
}

function groupByPerson(
  invoices: AdminInvoiceRow[],
  tab: HubTab,
): PersonInvoiceGroup[] {
  const map = new Map<string, PersonInvoiceGroup>();

  for (const invoice of invoices) {
    const key = personKey(invoice, tab);
    const personName =
      tab === "prof" ? invoice.prof_name : invoice.parent_name;
    let group = map.get(key);
    if (!group) {
      group = { key, personName, invoices: [], totalAmount: 0 };
      map.set(key, group);
    }
    group.invoices.push(invoice);
    group.totalAmount += invoice.amount;
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      totalAmount: Math.round(group.totalAmount * 100) / 100,
      invoices: [...group.invoices].sort((a, b) => {
        const dateA = a.scheduled_at ?? a.created_at;
        const dateB = b.scheduled_at ?? b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
    }))
    .sort((a, b) => a.personName.localeCompare(b.personName, "fr"));
}

function formatCourseDate(iso: string | null, fallback: string): string {
  const value = iso ?? fallback;
  return new Date(value).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(iso ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function InvoiceLineItem({
  invoice,
  tab,
  onOpen,
  onResend,
  opening,
  resendingId,
}: {
  invoice: AdminInvoiceRow;
  tab: HubTab;
  onOpen: (id: string) => void;
  onResend: (id: string) => void;
  opening: boolean;
  resendingId: string | null;
}) {
  const courseDate = formatCourseDate(
    invoice.scheduled_at,
    invoice.created_at,
  );
  const counterparty =
    tab === "prof"
      ? `Élève / parent : ${invoice.parent_name}`
      : `Prof : ${invoice.prof_name}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">
          {invoice.course_subject}
        </p>
        <p className="mt-0.5 text-xs text-ink-600">
          {courseDate} · {counterparty}
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          {invoice.invoice_number} ·{" "}
          <span className="font-medium text-ink-800">
            {formatEuro(invoice.amount)}
            {tab === "prof" ? " HT" : " TTC"}
          </span>
        </p>
        {tab === "parents" ? (
          <p className="mt-1 text-xs">
            {invoice.parent_email_sent_at ? (
              <span className="inline-flex items-center gap-1 text-success">
                <MailCheck className="h-3.5 w-3.5" aria-hidden />
                E-mail envoyé le{" "}
                {new Date(invoice.parent_email_sent_at).toLocaleString("fr-FR")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-warning">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                E-mail non envoyé
              </span>
            )}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {tab === "parents" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resendingId === invoice.id}
            onClick={() => onResend(invoice.id)}
          >
            <Mail className="mr-1.5 h-4 w-4" aria-hidden />
            {resendingId === invoice.id ? "Envoi…" : "Renvoyer"}
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
          PDF
        </Button>
      </div>
    </li>
  );
}

function PersonInvoiceSection({
  group,
  tab,
  defaultOpen,
  onOpen,
  onResend,
  opening,
  resendingId,
}: {
  group: PersonInvoiceGroup;
  tab: HubTab;
  defaultOpen?: boolean;
  onOpen: (id: string) => void;
  onResend: (id: string) => void;
  opening: boolean;
  resendingId: string | null;
}) {
  const amountLabel =
    tab === "prof"
      ? `${formatEuro(group.totalAmount)} HT`
      : `${formatEuro(group.totalAmount)} TTC`;

  return (
    <details
      className="group rounded-lg border border-line bg-paper/30"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{group.personName}</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {group.invoices.length} facture
            {group.invoices.length > 1 ? "s" : ""} · {amountLabel}
          </p>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ul className="space-y-2 border-t border-line px-4 pb-4 pt-3">
        {group.invoices.map((invoice) => (
          <InvoiceLineItem
            key={invoice.id}
            invoice={invoice}
            tab={tab}
            onOpen={onOpen}
            onResend={onResend}
            opening={opening}
            resendingId={resendingId}
          />
        ))}
      </ul>
    </details>
  );
}

export function AdminInvoicesHub({ filters }: AdminInvoicesHubProps) {
  const [tab, setTab] = useState<HubTab>("prof");
  const [emailStatus, setEmailStatus] = useState<"all" | "sent" | "not_sent">(
    "all",
  );
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAdminInvoices({
    period: filters.period,
    campusId: filters.campusId !== "all" ? filters.campusId : undefined,
    search: filters.search.trim() || undefined,
    emailStatus:
      tab === "parents" && emailStatus !== "all" ? emailStatus : undefined,
  });

  const openPdf = useOpenAdminInvoicePdf();
  const resendParent = useResendParentInvoice();

  const profGroups = useMemo(() => {
    const studentInvoices = (data?.invoices ?? []).filter(
      (inv) => inv.invoice_type === "student",
    );
    return groupByPerson(studentInvoices, "prof");
  }, [data?.invoices]);

  const parentGroups = useMemo(() => {
    const parentInvoices = (data?.invoices ?? []).filter(
      (inv) => inv.invoice_type === "parent",
    );
    return groupByPerson(parentInvoices, "parents");
  }, [data?.invoices]);

  const activeGroups = tab === "prof" ? profGroups : parentGroups;

  async function handleResend(invoiceId: string) {
    setResendingId(invoiceId);
    try {
      await resendParent.mutateAsync(invoiceId);
    } finally {
      setResendingId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-md border border-line bg-surface p-5">
      <div>
        <h3 className="font-semibold text-ink-900">Centre de facturation</h3>
        <p className="mt-1 text-sm text-ink-600">
          Factures générées automatiquement après chaque paiement — montants
          calculés selon le tarif horaire du prof et la durée du cours.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "prof" ? "default" : "outline"}
          onClick={() => setTab("prof")}
        >
          Professeurs
          {profGroups.length > 0 ? (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
              {profGroups.length}
            </span>
          ) : null}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "parents" ? "default" : "outline"}
          onClick={() => setTab("parents")}
        >
          Élèves / Parents
          {parentGroups.length > 0 ? (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
              {parentGroups.length}
            </span>
          ) : null}
        </Button>
        {tab === "parents" ? (
          <>
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
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void refetch()}
        >
          Actualiser
        </Button>
      </div>

      {tab === "prof" ? (
        <p className="text-xs text-ink-500">
          Factures URSSAF émises par chaque auto-entrepreneur — montant HT =
          tarif horaire × durée − commission plateforme.
        </p>
      ) : (
        <p className="text-xs text-ink-500">
          Factures SAP émises par Gadz&apos;Connect aux parents — montant TTC
          payé par carte.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement des factures…</p>
      ) : isError ? (
        <p className="text-sm text-danger">
          Impossible de charger les factures. Vérifiez la migration 015.
        </p>
      ) : activeGroups.length === 0 ? (
        <p className="text-sm text-ink-600">
          Aucune facture {tab === "prof" ? "professeur" : "parent"} sur la
          période — elles apparaissent après un paiement Stripe confirmé.
        </p>
      ) : (
        <div className="space-y-3">
          {activeGroups.map((group, index) => (
            <PersonInvoiceSection
              key={group.key}
              group={group}
              tab={tab}
              defaultOpen={index === 0}
              onOpen={(id) => openPdf.mutate(id)}
              onResend={handleResend}
              opening={openPdf.isPending}
              resendingId={resendingId}
            />
          ))}
        </div>
      )}

      {data?.meta ? (
        <p className="text-xs text-ink-400">
          {data.meta.total} facture{data.meta.total > 1 ? "s" : ""} sur la
          période
        </p>
      ) : null}

      {resendParent.isError ? (
        <p className="text-sm text-danger">
          {(resendParent.error as Error).message}
        </p>
      ) : null}
      {resendParent.isSuccess ? (
        <p className="text-sm text-success">Facture parent renvoyée par e-mail.</p>
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
