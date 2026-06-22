function slugPart(value: string, maxLen = 24): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLen);
}

export interface InvoiceFilenameInput {
  invoiceNumber: string;
  invoiceType: "parent" | "student";
  parentLastName?: string | null;
  profLastName?: string | null;
  subject?: string | null;
}

/**
 * Nom de fichier lisible pour archivage / pièce jointe e-mail.
 * Ex. GC-PARENT-2026-000042_Dupont_Martin_SolidWorks.pdf
 */
export function buildInvoiceDownloadFilename(
  input: InvoiceFilenameInput,
): string {
  const parts = [input.invoiceNumber.replace(/\s+/g, "-")];
  if (input.parentLastName?.trim()) {
    parts.push(slugPart(input.parentLastName));
  }
  if (input.profLastName?.trim()) {
    parts.push(slugPart(input.profLastName));
  }
  if (input.subject?.trim()) {
    parts.push(slugPart(input.subject));
  }
  const prefix =
    input.invoiceType === "parent" ? "facture-parent" : "facture-etudiant";
  return `${prefix}_${parts.join("_")}.pdf`;
}
