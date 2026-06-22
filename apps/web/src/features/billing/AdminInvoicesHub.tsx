import { Button, cn } from "@gadz-connect/ui";
import { ChevronRight, FileText, Mail, MailCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { formatEuro } from "@/features/admin/format";
import type { BudgetFiltersState } from "@/features/admin/budgets/budgetFilters";
import { formatPersonName } from "@/features/admin/budgets/adminBudgetLabels";
import type { AdminTransactionRow } from "@/features/admin/types";
import {
  useAdminInvoices,
  useOpenAdminInvoicePdf,
  useResendParentInvoice,
  type AdminInvoiceRow,
} from "./useInvoices";
import { AdminInvoicePreviewPanel } from "./AdminInvoicePreviewPanel";

interface AdminInvoicesHubProps {
  filters: BudgetFiltersState;
  transactions?: AdminTransactionRow[];
}

type HubTab = "prof" | "parents";

interface PendingCourseLine {
  id: string;
  courseSubject: string;
  scheduledAt: string | null;
  amount: number;
  counterparty: string;
}

interface PersonInvoiceGroup {
  key: string;
  personName: string;
  invoices: AdminInvoiceRow[];
  pending: PendingCourseLine[];
  totalAmount: number;
}

function personKeyFromInvoice(invoice: AdminInvoiceRow, tab: HubTab): string {
  if (tab === "prof") {
    return invoice.provider_profile_id ?? invoice.prof_name;
  }
  return invoice.client_profile_id ?? invoice.parent_name;
}

function personKeyFromTransaction(
  tx: AdminTransactionRow,
  tab: HubTab,
): string {
  if (tab === "prof") {
    return formatPersonName(tx.course.provider);
  }
  return formatPersonName(tx.course.client);
}

function groupInvoicesByPerson(
  invoices: AdminInvoiceRow[],
  tab: HubTab,
): Map<string, PersonInvoiceGroup> {
  const map = new Map<string, PersonInvoiceGroup>();

  for (const invoice of invoices) {
    const key = personKeyFromInvoice(invoice, tab);
    const personName =
      tab === "prof" ? invoice.prof_name : invoice.parent_name;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        personName,
        invoices: [],
        pending: [],
        totalAmount: 0,
      };
      map.set(key, group);
    }
    group.invoices.push(invoice);
    group.totalAmount += invoice.amount;
  }

  return map;
}

function mergeTransactionPlaceholders(
  map: Map<string, PersonInvoiceGroup>,
  transactions: AdminTransactionRow[],
  tab: HubTab,
): PersonInvoiceGroup[] {
  for (const tx of transactions) {
    if (tx.status_stripe !== "succeeded") continue;

    const key = personKeyFromTransaction(tx, tab);
    const personName =
      tab === "prof"
        ? formatPersonName(tx.course.provider)
        : formatPersonName(tx.course.client);

    if (personName === "—") continue;

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        personName,
        invoices: [],
        pending: [],
        totalAmount: 0,
      };
      map.set(key, group);
    }

    const alreadyInvoiced = group.invoices.some(
      (inv) => inv.transaction_id === tx.id,
    );
    if (alreadyInvoiced) continue;

    const courseLabel =
      tx.course.subject || tx.course.title || "Cours de tutorat";
    const counterparty =
      tab === "prof"
        ? formatPersonName(tx.course.client)
        : formatPersonName(tx.course.provider);

    group.pending.push({
      id: tx.id,
      courseSubject: courseLabel,
      scheduledAt: tx.course.scheduled_at,
      amount:
        tab === "prof"
          ? Math.round((tx.amount_gross - tx.commission_sasu) * 100) / 100
          : tx.amount_gross,
      counterparty,
    });
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
      pending: [...group.pending].sort((a, b) => {
        const dateA = a.scheduledAt ?? "";
        const dateB = b.scheduledAt ?? "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
    }))
    .filter((group) => group.invoices.length > 0 || group.pending.length > 0)
    .sort((a, b) => a.personName.localeCompare(b.personName, "fr"));
}

function formatCourseDate(iso: string | null, fallback?: string): string {
  const value = iso ?? fallback;
  if (!value) return "—";
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
  const counterparty =
    tab === "prof"
      ? `Élève / parent : ${invoice.parent_name}`
      : `Prof : ${invoice.prof_name}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">
          {invoice.course_subject}
        </p>
        <p className="mt-0.5 text-xs text-ink-600">
          {formatCourseDate(invoice.scheduled_at, invoice.created_at)} ·{" "}
          {counterparty}
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

function PendingLineItem({
  line,
  tab,
}: {
  line: PendingCourseLine;
  tab: HubTab;
}) {
  return (
    <li className="rounded-lg border border-dashed border-warning/30 bg-warning-bg/30 px-3 py-2.5 text-sm">
      <p className="font-medium text-ink-900">{line.courseSubject}</p>
      <p className="mt-0.5 text-xs text-ink-600">
        {formatCourseDate(line.scheduledAt)} ·{" "}
        {tab === "prof"
          ? `Élève / parent : ${line.counterparty}`
          : `Prof : ${line.counterparty}`}
        {" · "}
        {formatEuro(line.amount)}
        {tab === "prof" ? " HT" : " TTC"} attendu
      </p>
      <p className="mt-1 text-xs text-warning">
        Facture non générée — vérifiez migration 015 et webhook Stripe.
      </p>
    </li>
  );
}

function PersonInvoiceSection({
  group,
  tab,
  isOpen,
  onToggle,
  onOpen,
  onResend,
  opening,
  resendingId,
}: {
  group: PersonInvoiceGroup;
  tab: HubTab;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  onResend: (id: string) => void;
  opening: boolean;
  resendingId: string | null;
}) {
  const itemCount = group.invoices.length + group.pending.length;
  const amountLabel =
    group.invoices.length > 0
      ? tab === "prof"
        ? `${formatEuro(group.totalAmount)} HT`
        : `${formatEuro(group.totalAmount)} TTC`
      : null;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper/30">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper/80"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{group.personName}</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {itemCount} cours
            {amountLabel ? ` · ${amountLabel} facturé` : ""}
            {group.pending.length > 0
              ? ` · ${group.pending.length} en attente`
              : ""}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "h-5 w-5 shrink-0 text-ink-400 transition-transform",
            isOpen && "rotate-90",
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <ul className="space-y-2 border-t border-line bg-surface/50 px-4 pb-4 pt-3">
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
          {group.pending.map((line) => (
            <PendingLineItem key={line.id} line={line} tab={tab} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminInvoicesHub({
  filters,
  transactions = [],
}: AdminInvoicesHubProps) {
  const [tab, setTab] = useState<HubTab>("prof");
  const [openPersonKey, setOpenPersonKey] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"all" | "sent" | "not_sent">(
    "all",
  );
  const [resendingId, setResendingId] = useState<string | null>(null);

  const succeededTransactions = useMemo(
    () => transactions.filter((tx) => tx.status_stripe === "succeeded"),
    [transactions],
  );

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
    const studentOnly = (data?.invoices ?? []).filter(
      (inv) => inv.invoice_type === "student",
    );
    const map = groupInvoicesByPerson(studentOnly, "prof");
    return mergeTransactionPlaceholders(map, succeededTransactions, "prof");
  }, [data?.invoices, succeededTransactions]);

  const parentGroups = useMemo(() => {
    const parentOnly = (data?.invoices ?? []).filter(
      (inv) => inv.invoice_type === "parent",
    );
    const map = groupInvoicesByPerson(parentOnly, "parents");
    return mergeTransactionPlaceholders(map, succeededTransactions, "parents");
  }, [data?.invoices, succeededTransactions]);

  const activeGroups = tab === "prof" ? profGroups : parentGroups;

  async function handleResend(invoiceId: string) {
    setResendingId(invoiceId);
    try {
      await resendParent.mutateAsync(invoiceId);
    } finally {
      setResendingId(null);
    }
  }

  function handleTabChange(next: HubTab) {
    setTab(next);
    setOpenPersonKey(null);
  }

  return (
    <section className="space-y-4 rounded-md border border-line bg-surface p-5">
      <div>
        <h3 className="font-semibold text-ink-900">Centre de facturation</h3>
        <p className="mt-1 text-sm text-ink-600">
          Cliquez sur un nom pour voir toutes ses factures. Montants calculés
          automatiquement selon le tarif horaire et la durée du cours.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "prof" ? "default" : "outline"}
          onClick={() => handleTabChange("prof")}
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
          onClick={() => handleTabChange("parents")}
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
          Uniquement les factures URSSAF du prof (auto-entrepreneur) — montant HT.
        </p>
      ) : (
        <p className="text-xs text-ink-500">
          Uniquement les factures SAP aux parents — montant TTC payé par carte.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">
          Impossible de charger les factures. Vérifiez la migration 015.
        </p>
      ) : activeGroups.length === 0 ? (
        <p className="text-sm text-ink-600">
          Aucun {tab === "prof" ? "professeur" : "parent"} avec cours payé sur
          la période.
        </p>
      ) : (
        <div className="space-y-2">
          {activeGroups.map((group) => (
            <PersonInvoiceSection
              key={group.key}
              group={group}
              tab={tab}
              isOpen={openPersonKey === group.key}
              onToggle={() =>
                setOpenPersonKey((prev) =>
                  prev === group.key ? null : group.key,
                )
              }
              onOpen={(id) => openPdf.mutate(id)}
              onResend={handleResend}
              opening={openPdf.isPending}
              resendingId={resendingId}
            />
          ))}
        </div>
      )}

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
          Aperçu modèle PDF (démo)
        </summary>
        <div className="border-t border-line px-4 pb-4 pt-3">
          <AdminInvoicePreviewPanel
            embedded
            variant={tab === "prof" ? "student" : "parent"}
          />
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
      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
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
