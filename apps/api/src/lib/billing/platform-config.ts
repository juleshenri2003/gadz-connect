export interface PlatformBillingConfig {
  legalName: string;
  sapNumber: string;
  address: string;
  siret: string | null;
  /** Chemin local optionnel vers le logo (PNG/JPG) pour les PDF. */
  logoPath: string | null;
  vatApplicable: boolean;
  vatRate: number;
  emailFrom: string;
}

export function getPlatformBillingConfig(): PlatformBillingConfig {
  const vatApplicable = process.env.GADZ_VAT_APPLICABLE === "true";

  return {
    legalName: process.env.GADZ_PLATFORM_LEGAL_NAME?.trim() || "Gadz'Connect",
    sapNumber: process.env.GADZ_SAP_NUMBER?.trim() || "SAP-000000000",
    address:
      process.env.GADZ_PLATFORM_ADDRESS?.trim() ||
      "Arts et Métiers — Paris, France",
    siret: process.env.GADZ_PLATFORM_SIRET?.trim() || null,
    logoPath: process.env.GADZ_PLATFORM_LOGO_PATH?.trim() || null,
    vatApplicable,
    vatRate: vatApplicable ? Number(process.env.GADZ_VAT_RATE ?? "20") : 0,
    emailFrom:
      process.env.GADZ_BILLING_EMAIL_FROM?.trim() ||
      "facturation@gadzconnect.fr",
  };
}
