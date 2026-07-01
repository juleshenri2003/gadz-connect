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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseDevAllowlist(): Set<string> {
  const raw = process.env.RESEND_DEV_ALLOWLIST?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean),
  );
}

/**
 * Comptes @ensam.eu locaux : Resend ne peut pas les délivrer en test.
 * Les adresses externes réelles (Gmail, etc.) passent en destinataire réel.
 */
export function isDevRedirectedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (parseDevAllowlist().has(normalized)) return false;
  return normalized.endsWith("@ensam.eu");
}

function getDevInboxOverride(): string | undefined {
  const explicit = process.env.RESEND_DEV_INBOX?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production") {
    return "juleshenri2003@gmail.com";
  }
  return undefined;
}

export interface ResendDeliveryResult {
  ok: boolean;
  status: number;
  body: string;
  deliveredTo: string;
  intendedTo: string;
  redirected: boolean;
}

function isResendTestRecipientBlocked(status: number, body: string): boolean {
  return (
    status === 403 &&
    body.includes("You can only send testing emails to your own email address")
  );
}

/**
 * Envoie via Resend avec redirection dev (@ensam.eu) et repli si Resend test
 * refuse un destinataire externe (403 — domaine non vérifié).
 */
export async function deliverResendEmail(input: {
  apiKey: string;
  intendedTo: string;
  from: string;
  subject: string;
  buildHtml: (ctx: { redirected: boolean; intendedTo: string }) => string;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<ResendDeliveryResult> {
  const sendTo = async (
    to: string,
    redirected: boolean,
  ): Promise<{ ok: boolean; status: number; body: string }> => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: [to],
        subject: input.subject,
        html: input.buildHtml({ redirected, intendedTo: input.intendedTo }),
        ...(input.attachments?.length
          ? { attachments: input.attachments }
          : {}),
      }),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  };

  const first = resolveEmailRecipient(input.intendedTo);
  let attempt = await sendTo(first.to, first.redirected);

  if (
    !attempt.ok &&
    isResendTestRecipientBlocked(attempt.status, attempt.body) &&
    !first.redirected
  ) {
    const fallback = getDevInboxOverride();
    if (fallback) {
      attempt = await sendTo(fallback, true);
      return {
        ok: attempt.ok,
        status: attempt.status,
        body: attempt.body,
        deliveredTo: fallback,
        intendedTo: input.intendedTo,
        redirected: true,
      };
    }
  }

  return {
    ok: attempt.ok,
    status: attempt.status,
    body: attempt.body,
    deliveredTo: first.to,
    intendedTo: input.intendedTo,
    redirected: first.redirected,
  };
}

/**
 * En dev/test Resend, redirige les comptes fictifs @ensam.eu vers une boîte autorisée.
 * Les e-mails externes réels (ex. prof test Gmail) sont envoyés au destinataire prévu.
 * Prod : destinataire réel inchangé.
 */
export function resolveEmailRecipient(intended: string): {
  to: string;
  redirected: boolean;
} {
  const override = getDevInboxOverride();
  const normalizedIntended = normalizeEmail(intended);

  if (!override) {
    return { to: intended, redirected: false };
  }

  if (normalizeEmail(override) === normalizedIntended) {
    return { to: intended, redirected: false };
  }

  if (!isDevRedirectedEmail(intended)) {
    return { to: intended, redirected: false };
  }

  return { to: override, redirected: true };
}
