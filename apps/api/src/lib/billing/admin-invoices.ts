import { createInvoiceSignedUrl } from "./invoice-storage.js";
import { supabaseAdmin } from "../supabase.js";

export interface AdminInvoiceRow {
  id: string;
  invoice_type: "parent" | "student";
  invoice_number: string;
  amount: number;
  created_at: string;
  parent_email_sent_at: string | null;
}

export async function fetchAdminTransactionInvoices(
  transactionId: string,
  scopeCampusId: string | undefined,
): Promise<AdminInvoiceRow[]> {
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("transactions")
    .select("id, course:courses!inner ( campus_id )")
    .eq("id", transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    throw new Error("Transaction introuvable");
  }

  const course = transaction.course as { campus_id: string } | { campus_id: string }[] | { campus_id: string }[][];
  let campusId: string | undefined;
  if (Array.isArray(course)) {
    const first = course[0];
    campusId = Array.isArray(first)
      ? (first[0] as { campus_id?: string })?.campus_id
      : (first as { campus_id?: string })?.campus_id;
  } else {
    campusId = course.campus_id;
  }

  if (scopeCampusId && campusId !== scopeCampusId) {
    throw new Error("Transaction hors périmètre");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_invoices")
    .select(
      "id, invoice_type, invoice_number, amount, created_at, parent_email_sent_at",
    )
    .eq("transaction_id", transactionId)
    .order("invoice_type");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    invoice_type: row.invoice_type as "parent" | "student",
    invoice_number: row.invoice_number as string,
    amount: Number(row.amount),
    created_at: row.created_at as string,
    parent_email_sent_at: (row.parent_email_sent_at as string | null) ?? null,
  }));
}

export async function createAdminInvoiceSignedUrl(
  invoiceId: string,
  scopeCampusId: string | undefined,
): Promise<string> {
  const { data: invoice, error } = await supabaseAdmin
    .from("payment_invoices")
    .select(
      "id, storage_path, transaction:transactions!inner ( course:courses!inner ( campus_id ) )",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !invoice) {
    throw new Error("Facture introuvable");
  }

  const transaction = invoice.transaction as unknown as {
    course: { campus_id: string } | { campus_id: string }[] | { campus_id: string }[][];
  };
  const course = transaction.course;
  let campusId: string | undefined;
  if (Array.isArray(course)) {
    const first = course[0];
    campusId = Array.isArray(first)
      ? (first[0] as { campus_id?: string })?.campus_id
      : (first as { campus_id?: string })?.campus_id;
  } else {
    campusId = course.campus_id;
  }

  if (scopeCampusId && campusId !== scopeCampusId) {
    throw new Error("Facture hors périmètre");
  }

  return createInvoiceSignedUrl(invoice.storage_path as string);
}
