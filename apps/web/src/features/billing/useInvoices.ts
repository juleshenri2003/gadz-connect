import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import type { AdminBudgetPeriod } from "@/features/admin/types";
import { API_URL, apiFetch } from "@/lib/api";

export type InvoiceType = "parent" | "student";

export interface AdminInvoiceRow {
  id: string;
  invoice_type: InvoiceType;
  invoice_number: string;
  amount: number;
  created_at: string;
  parent_email_sent_at?: string | null;
  transaction_id: string;
  course_id: string;
  parent_name: string;
  prof_name: string;
  provider_profile_id: string | null;
  client_profile_id: string | null;
  course_subject: string;
  course_title: string;
  scheduled_at: string | null;
  campus_name: string | null;
  download_filename: string;
}

/** @deprecated use AdminInvoiceRow */
export type PaymentInvoiceRow = AdminInvoiceRow;

export interface AdminInvoicesMeta {
  total: number;
  page: number;
  pageSize: number;
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

export interface AdminInvoicesQueryParams {
  period?: AdminBudgetPeriod;
  campusId?: string;
  search?: string;
  invoiceType?: InvoiceType;
  emailStatus?: "sent" | "not_sent";
  page?: number;
}

export function useAdminInvoices(params: AdminInvoicesQueryParams) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-invoices", params],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");

      const searchParams = new URLSearchParams();
      if (params.period) searchParams.set("period", params.period);
      if (params.campusId) searchParams.set("campus_id", params.campusId);
      if (params.search) searchParams.set("search", params.search);
      if (params.invoiceType) {
        searchParams.set("invoice_type", params.invoiceType);
      }
      if (params.emailStatus) {
        searchParams.set("email_status", params.emailStatus);
      }
      if (params.page) searchParams.set("page", String(params.page));

      const qs = searchParams.toString();
      const res = await apiFetch<{
        data: AdminInvoiceRow[];
        meta: AdminInvoicesMeta;
      }>(`/api/admin/invoices${qs ? `?${qs}` : ""}`, { token });
      return { invoices: res.data, meta: res.meta };
    },
    enabled: Boolean(getAccessToken()),
  });
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
      const res = await apiFetch<{ data: AdminInvoiceRow[] }>(
        `/api/admin/transactions/${transactionId}/invoices`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(transactionId && getAccessToken()),
  });
}

export function useOpenAdminInvoicePdf() {
  const { getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await openAuthenticatedPdf(`/api/admin/invoices/${invoiceId}/pdf`, token);
    },
  });
}

export function useAdminInvoicePdfEmbed(invoiceId: string | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-invoice-pdf-embed", invoiceId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !invoiceId) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/api/admin/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Erreur HTTP ${res.status}`);
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(invoiceId && getAccessToken()),
    staleTime: 60_000,
  });
}

/** URL blob pour afficher le PDF inline (aperçu dans la page). */
export function useAdminInvoicePdfBlob(invoiceId: string | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-invoice-pdf-blob", invoiceId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !invoiceId) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/api/admin/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Erreur HTTP ${res.status}`);
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(invoiceId && getAccessToken()),
    staleTime: 60_000,
  });
}

/** Aperçu démo inline (quand la facture réelle n'existe pas encore). */
export function useAdminDemoInvoicePdfBlob(type: InvoiceType | null) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: ["admin-invoice-demo-pdf-blob", type],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token || !type) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/api/admin/invoices/preview/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Impossible de charger l'aperçu démo");
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(type && getAccessToken()),
    staleTime: 60_000,
  });
}

/** @deprecated use useOpenAdminInvoicePdf */
export const useOpenAdminInvoiceUrl = useOpenAdminInvoicePdf;

export function useResendParentInvoice() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { sent: boolean; skipped: boolean; reason?: string };
      }>(`/api/admin/invoices/${invoiceId}/resend-parent`, {
        method: "POST",
        token,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-transaction-invoices"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
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
      const res = await apiFetch<{ data: AdminInvoiceRow[] }>(
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
