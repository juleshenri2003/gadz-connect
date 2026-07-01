import {
  getPlatformEmailFrom,
  getResendApiKey,
  resolveEmailRecipient,
} from "./resend-config.js";

export interface SendParentInvoiceEmailInput {
  to: string;
  parentName: string;
  invoiceNumber: string;
  amountGross: number;
  subject: string;
  pdfBuffer: Buffer;
  downloadFilename?: string;
}

export interface SendParentInvoiceEmailResult {
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

/**
 * Envoie la facture parent par e-mail (API Resend).
 * Sans RESEND_API_KEY : retourne skipped=true (PDF toujours généré et stocké).
 */
export async function sendParentInvoiceEmail(
  input: SendParentInvoiceEmailInput,
): Promise<SendParentInvoiceEmailResult> {
  const apiKey = getResendApiKey();
  const from = getPlatformEmailFrom();

  if (!apiKey) {
    console.warn(
      "[billing] RESEND_API_KEY absent — facture parent non envoyée par e-mail",
    );
    return { sent: false, skipped: true, reason: "RESEND_API_KEY non configurée" };
  }

  const { to, redirected } = resolveEmailRecipient(input.to);
  const subject = `Facture Gadz'Connect n° ${input.invoiceNumber}`;
  const attachmentName =
    input.downloadFilename?.trim() ||
    `facture-${input.invoiceNumber.replace(/\s+/g, "-")}.pdf`;
  const redirectNote = redirected
    ? `<p><em>[Dev] E-mail redirigé — destinataire prévu : ${input.to}</em></p>`
    : "";
  const html = `
    <p>Bonjour ${input.parentName},</p>
    <p>Votre paiement de <strong>${formatEuro(input.amountGross)}</strong> pour le cours « ${input.subject} » a bien été reçu.</p>
    <p>Vous trouverez en pièce jointe votre facture n° <strong>${input.invoiceNumber}</strong>.</p>
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
    console.error("[billing] envoi e-mail facture parent:", res.status, body);
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${res.status}`,
    };
  }

  if (redirected) {
    console.info(
      `[billing] facture parent ${input.invoiceNumber} → ${to} (dev, prévu ${input.to})`,
    );
  }

  return { sent: true, skipped: false };
}
