import {
  deliverResendEmail,
  getPlatformEmailFrom,
  getResendApiKey,
} from "./resend-config.js";

export interface SendProfInvoiceEmailInput {
  to: string;
  profName: string;
  invoiceNumber: string;
  amount: number;
  subject: string;
  pdfBuffer: Buffer;
  downloadFilename?: string;
}

export interface SendProfInvoiceEmailResult {
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
 * Envoie la facture professeur (micro-entreprise) par e-mail avec PDF joint.
 */
export async function sendProfInvoiceEmail(
  input: SendProfInvoiceEmailInput,
): Promise<SendProfInvoiceEmailResult> {
  const apiKey = getResendApiKey();
  const from = getPlatformEmailFrom();

  if (!apiKey) {
    console.warn(
      "[billing] RESEND_API_KEY absent — facture professeur non envoyée par e-mail",
    );
    return { sent: false, skipped: true, reason: "RESEND_API_KEY non configurée" };
  }

  const emailSubject = `Facture Gadz'Connect n° ${input.invoiceNumber}`;
  const attachmentName =
    input.downloadFilename?.trim() ||
    `facture-${input.invoiceNumber.replace(/\s+/g, "-")}.pdf`;

  const delivery = await deliverResendEmail({
    apiKey,
    intendedTo: input.to,
    from,
    subject: emailSubject,
    buildHtml: ({ redirected, intendedTo }) => {
      const redirectNote = redirected
        ? `<p><em>[Dev] E-mail redirigé — destinataire prévu : ${intendedTo}</em></p>`
        : "";
      return `
    <p>Bonjour ${input.profName},</p>
    <p>Un élève vient de régler un cours sur Gadz'Connect — voici votre facture n° <strong>${input.invoiceNumber}</strong> (${formatEuro(input.amount)} HT) pour « ${input.subject} ».</p>
    <p>Le PDF est en pièce jointe. Vous pouvez aussi le retrouver dans votre espace Gadz'Connect.</p>
    ${redirectNote}
    <p>Cordialement,<br/>L'équipe Gadz'Connect</p>
  `.trim();
    },
    attachments: [
      {
        filename: attachmentName,
        content: input.pdfBuffer.toString("base64"),
      },
    ],
  });

  if (!delivery.ok) {
    console.error(
      "[billing] envoi e-mail facture prof:",
      delivery.status,
      delivery.body,
    );
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${delivery.status}`,
    };
  }

  if (delivery.redirected) {
    console.info(
      `[billing] facture prof ${input.invoiceNumber} → ${delivery.deliveredTo} (dev, prévu ${delivery.intendedTo})`,
    );
  }

  return { sent: true, skipped: false };
}
