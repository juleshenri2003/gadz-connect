/** Configuration Resend / URLs app (local et prod). */

export interface ResendSendResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || undefined;
}

/**
 * Expéditeur des e-mails plateforme (onboarding, rappels).
 * En test Resend : onboarding@resend.dev (sans domaine vérifié).
 * En prod : domaine vérifié, ex. onboarding@gadzconnect.fr
 */
export function getPlatformEmailFrom(): string {
  return (
    process.env.GADZ_PLATFORM_EMAIL_FROM?.trim() ||
    process.env.GADZ_BILLING_EMAIL_FROM?.trim() ||
    "onboarding@resend.dev"
  );
}

/** URL publique du front (liens dans les e-mails). */
export function getAppBaseUrl(): string {
  const explicit = process.env.GADZ_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");

  return "http://localhost:5173";
}
