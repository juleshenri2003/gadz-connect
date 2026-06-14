import { supabaseAdmin } from "../supabase.js";

export const INVOICES_BUCKET = "invoices";

export function invoiceStoragePath(
  invoiceType: "parent" | "student",
  transactionId: string,
): string {
  return `${invoiceType}/${transactionId}.pdf`;
}

export async function uploadInvoicePdf(
  storagePath: string,
  buffer: Buffer,
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(INVOICES_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Stockage factures non configuré — exécutez la migration 015_billing_invoices.sql sur Supabase",
      );
    }
    throw new Error(error.message);
  }
}

export async function createInvoiceSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(INVOICES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Impossible de générer le lien PDF");
  }

  return data.signedUrl;
}
