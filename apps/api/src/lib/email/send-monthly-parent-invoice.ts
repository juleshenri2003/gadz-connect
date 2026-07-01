import {
  getPlatformEmailFrom,
  getResendApiKey,
  resolveEmailRecipient,
} from "./resend-config.js";

export interface SendMonthlyParentSummaryEmailInput {
  to: string;
  parentName: string;
  summaryNumber: string;
  billingPeriodLabel: string;
  totalAmount: number;
  lineCount: number;
  pdfBuffer: Buffer;
  downloadFilename?: string;
}

/** @deprecated Utiliser SendMonthlyParentSummaryEmailInput */
export type SendMonthlyParentInvoiceEmailInput = Omit<
  SendMonthlyParentSummaryEmailInput,
  "summaryNumber"
> & { invoiceNumber: string };

export interface SendMonthlyInvoiceEmailResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export async function sendMonthlyParentSummaryEmail(
  input: SendMonthlyParentSummaryEmailInput,
): Promise<SendMonthlyInvoiceEmailResult> {
  const apiKey = getResendApiKey();
  const from = getPlatformEmailFrom();

  if (!apiKey) {
    console.warn(
      "[billing] RESEND_API_KEY absent — relevé mensuel parent non envoyé",
    );
    return { sent: false, skipped: true, reason: "RESEND_API_KEY non configurée" };
  }

  const { to, redirected } = resolveEmailRecipient(input.to);
  const subject = `Relevé mensuel Gadz'Connect — ${input.billingPeriodLabel}`;
  const attachmentName =
    input.downloadFilename?.trim() ||
    `releve-mensuel-${input.summaryNumber.replace(/\s+/g, "-")}.pdf`;
  const redirectNote = redirected
    ? `<p><em>[Dev] E-mail redirigé — destinataire prévu : ${input.to}</em></p>`
    : "";
  const html = `
    <p>Bonjour ${input.parentName},</p>
    <p>Votre relevé mensuel pour <strong>${input.billingPeriodLabel}</strong> est disponible.</p>
    <p>Il récapitule <strong>${input.lineCount}</strong> facture(s) déjà émises à chaque paiement, pour un total de <strong>${formatEuro(input.totalAmount)}</strong> (n° ${input.summaryNumber}).</p>
    <p>Les factures individuelles restent disponibles dans votre espace Gadz'Connect.</p>
    ${redirectNote}
    <p>Cordialement,<br/>L'équipe Gadz'Connect</p>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments: [
        {
          filename: attachmentName,
          content: input.pdfBuffer.toString("base64"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[billing] envoi relevé mensuel parent:", res.status, body);
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${res.status}`,
    };
  }

  if (redirected) {
    console.info(
      `[billing] relevé parent ${input.summaryNumber} → ${to} (dev, prévu ${input.to})`,
    );
  }

  return { sent: true, skipped: false };
}

/** @deprecated Utiliser sendMonthlyParentSummaryEmail */
export async function sendMonthlyParentInvoiceEmail(
  input: SendMonthlyParentInvoiceEmailInput,
): Promise<SendMonthlyInvoiceEmailResult> {
  return sendMonthlyParentSummaryEmail({
    ...input,
    summaryNumber: input.invoiceNumber,
  });
}
