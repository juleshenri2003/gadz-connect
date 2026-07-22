import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@gadz-connect/ui";
import { FileText } from "lucide-react";
import { formatEuro } from "@/features/admin/format";
import type { AdminInvoiceRow } from "./useInvoices";
import {
  useOpenStudentInvoiceUrl,
  useStudentInvoices,
} from "./useInvoices";

type InvoiceSort = "date_desc" | "date_asc" | "amount_desc" | "subject_asc";

const SORT_OPTIONS: { id: InvoiceSort; label: string }[] = [
  { id: "date_desc", label: "Plus récentes" },
  { id: "date_asc", label: "Plus anciennes" },
  { id: "amount_desc", label: "Montant ↓" },
  { id: "subject_asc", label: "Matière A–Z" },
];

function invoiceDate(invoice: AdminInvoiceRow): Date {
  const raw = invoice.scheduled_at ?? invoice.created_at;
  return raw ? new Date(raw) : new Date(0);
}

function invoiceDateMs(invoice: AdminInvoiceRow): number {
  return invoiceDate(invoice).getTime();
}

function invoiceLabel(invoice: AdminInvoiceRow): string {
  return invoice.course_subject || invoice.course_title || "Cours de tutorat";
}

function profLabel(invoice: AdminInvoiceRow): string {
  if (invoice.is_monthly) return "Relevé mensuel";
  const name = invoice.prof_name?.trim();
  return name || "Professeur";
}

/** Clé mois calendaire YYYY-MM */
function monthKey(invoice: AdminInvoiceRow): string {
  const d = invoiceDate(invoice);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key: string): string {
  const parts = key.split("-");
  const y = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 1);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function sortInvoices(
  invoices: AdminInvoiceRow[],
  sort: InvoiceSort,
): AdminInvoiceRow[] {
  return [...invoices].sort((a, b) => {
    switch (sort) {
      case "date_asc":
        return invoiceDateMs(a) - invoiceDateMs(b);
      case "amount_desc":
        if (b.amount !== a.amount) return b.amount - a.amount;
        return invoiceDateMs(b) - invoiceDateMs(a);
      case "subject_asc": {
        const bySubject = invoiceLabel(a).localeCompare(invoiceLabel(b), "fr", {
          sensitivity: "base",
        });
        if (bySubject !== 0) return bySubject;
        return invoiceDateMs(b) - invoiceDateMs(a);
      }
      case "date_desc":
      default:
        return invoiceDateMs(b) - invoiceDateMs(a);
    }
  });
}

interface ProfGroup {
  key: string;
  label: string;
  total: number;
  items: AdminInvoiceRow[];
}

interface MonthGroup {
  key: string;
  label: string;
  total: number;
  count: number;
  professors: ProfGroup[];
}

function groupByMonthThenProf(
  invoices: AdminInvoiceRow[],
  sort: InvoiceSort,
): MonthGroup[] {
  const byMonth = new Map<string, AdminInvoiceRow[]>();
  for (const invoice of invoices) {
    const key = monthKey(invoice);
    const list = byMonth.get(key) ?? [];
    list.push(invoice);
    byMonth.set(key, list);
  }

  const monthKeys = [...byMonth.keys()].sort((a, b) =>
    sort === "date_asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  return monthKeys.map((mKey) => {
    const monthItems = byMonth.get(mKey) ?? [];
    const byProf = new Map<string, AdminInvoiceRow[]>();
    for (const invoice of monthItems) {
      const pKey = profLabel(invoice);
      const list = byProf.get(pKey) ?? [];
      list.push(invoice);
      byProf.set(pKey, list);
    }

    const profKeys = [...byProf.keys()].sort((a, b) => {
      // Relevés mensuels en bas du mois
      if (a === "Relevé mensuel") return 1;
      if (b === "Relevé mensuel") return -1;
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });

    const professors: ProfGroup[] = profKeys.map((pKey) => {
      const items = sortInvoices(byProf.get(pKey) ?? [], sort);
      return {
        key: pKey,
        label: pKey,
        total: items.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
        items,
      };
    });

    return {
      key: mKey,
      label: monthLabel(mKey),
      total: professors.reduce((sum, group) => sum + group.total, 0),
      count: monthItems.length,
      professors,
    };
  });
}

function InvoiceRow({
  invoice,
  onOpen,
  pending,
}: {
  invoice: AdminInvoiceRow;
  onOpen: (id: string) => void;
  pending: boolean;
}) {
  const isMonthly = Boolean(invoice.is_monthly);
  const date = invoiceDate(invoice).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper/80 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-ink-900">
          {isMonthly ? (
            <span className="mr-2 rounded bg-ink-100 px-1.5 py-0.5 text-xs font-normal text-ink-600">
              Relevé
            </span>
          ) : (
            <span className="mr-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-normal text-brand-700">
              Cours
            </span>
          )}
          {invoiceLabel(invoice)}
        </p>
        <p className="mt-0.5 text-ink-600">
          {invoice.invoice_number} · {date} · {formatEuro(invoice.amount)}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => onOpen(invoice.id)}
      >
        <FileText className="mr-1.5 h-4 w-4" aria-hidden />
        Voir PDF
      </Button>
    </li>
  );
}

function MonthSection({
  label,
  count,
  total,
  children,
}: {
  label: string;
  count: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-l-4 border-line border-l-brand-500">
      <header className="border-b border-line bg-brand-50/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold capitalize text-ink-900">
              {label}
            </h4>
            <p className="mt-0.5 text-xs text-ink-600">
              {count} document{count > 1 ? "s" : ""} · total{" "}
              {formatEuro(total)}
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-ink-700">
            {count}
          </span>
        </div>
      </header>
      <div className="space-y-4 bg-surface p-3">{children}</div>
    </section>
  );
}

function ProfBlock({
  label,
  total,
  count,
  children,
}: {
  label: string;
  total: number;
  count: number;
  children: ReactNode;
}) {
  const isMonthly = label === "Relevé mensuel";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-0.5">
        <h5 className="text-sm font-semibold text-ink-800">
          {isMonthly ? label : `Prof. ${label}`}
        </h5>
        <p className="text-xs text-ink-500">
          {count} · {formatEuro(total)}
        </p>
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

export function StudentInvoicesList() {
  const { data: invoices, isLoading, isError } = useStudentInvoices();
  const openInvoice = useOpenStudentInvoiceUrl();
  const [sort, setSort] = useState<InvoiceSort>("date_desc");

  const months = useMemo(
    () => groupByMonthThenProf(invoices ?? [], sort),
    [invoices, sort],
  );

  return (
    <section
      id="factures"
      className="scroll-mt-6 space-y-4 rounded-md border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Mes factures</h3>
          <p className="mt-1 text-sm text-ink-600">
            Par mois, puis par professeur — factures de cours et relevés.
          </p>
        </div>
        {(invoices?.length ?? 0) > 0 ? (
          <label className="flex flex-col gap-1 text-xs text-ink-600">
            Trier dans le groupe
            <select
              className="rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink-900"
              value={sort}
              onChange={(event) => setSort(event.target.value as InvoiceSort)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">Impossible de charger les factures.</p>
      ) : !invoices?.length ? (
        <p className="text-sm text-ink-600">
          Aucune facture pour l&apos;instant. Elles apparaissent dès que vous
          réglez un cours.
        </p>
      ) : (
        <div className="space-y-4">
          {months.map((month) => (
            <MonthSection
              key={month.key}
              label={month.label}
              count={month.count}
              total={month.total}
            >
              {month.professors.map((prof) => (
                <ProfBlock
                  key={`${month.key}-${prof.key}`}
                  label={prof.label}
                  total={prof.total}
                  count={prof.items.length}
                >
                  {prof.items.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      pending={openInvoice.isPending}
                      onOpen={(id) => openInvoice.mutate(id)}
                    />
                  ))}
                </ProfBlock>
              ))}
            </MonthSection>
          ))}
        </div>
      )}
    </section>
  );
}
