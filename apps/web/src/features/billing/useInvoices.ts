import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { API_URL, apiFetch } from "@/lib/api";

export type InvoiceType = "parent" | "student";

export interface PaymentInvoiceRow {
  id: string;
  invoice_type: InvoiceType;
  invoice_number: string;
  amount: number;
  created_at: string;
  parent_email_sent_at?: string | null;
  course?: {
    subject: string | null;
    title: string;
    scheduled_at: string | null;
  } | null;
}

const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  parent: "Facture parent",
  student: "Facture étudiant",
};

export function invoiceTypeLabel(type: InvoiceType): string {
  return INVOICE_TYPE_LABELS[type];
}

async function openAuthenticatedPdf(path: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Erreur HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function useAdminInvoicePreview() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (type: InvoiceType) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await openAuthenticatedPdf(`/api/admin/invoices/preview/${type}`, token);
    },
  });
}

export function useAdminTransactionInvoices(transactionId: string | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-transaction-invoices", transactionId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !transactionId) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: PaymentInvoiceRow[] }>(
        `/api/admin/transactions/${transactionId}/invoices`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(transactionId && getAccessToken()),
  });
}

export function useOpenAdminInvoiceUrl() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { url: string } }>(
        `/api/admin/invoices/${invoiceId}/url`,
        { token },
      );
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    },
  });
}

export function useTeacherInvoices() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["teacher-invoices"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: PaymentInvoiceRow[] }>(
        "/api/tutors/me/invoices",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(getAccessToken()),
  });
}

export function useOpenTeacherInvoiceUrl() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { url: string } }>(
        `/api/tutors/me/invoices/${invoiceId}/url`,
        { token },
      );
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    },
  });
}
