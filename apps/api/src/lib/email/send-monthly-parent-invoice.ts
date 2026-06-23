export interface SendMonthlyParentInvoiceEmailInput {
  to: string;
  parentName: string;
  invoiceNumber: string;
  billingPeriodLabel: string;
  totalAmount: number;
  lineCount: number;
  pdfBuffer: Buffer;
  downloadFilename?: string;
}

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

export async function sendMonthlyParentInvoiceEmail(
  input: SendMonthlyParentInvoiceEmailInput,
): Promise<SendMonthlyInvoiceEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.GADZ_BILLING_EMAIL_FROM?.trim() || "facturation@gadzconnect.fr";

  if (!apiKey) {
    console.warn(
      "[billing] RESEND_API_KEY absent — facture mensuelle parent non envoyée",
    );
    return { sent: false, skipped: true, reason: "RESEND_API_KEY non configurée" };
  }

  const subject = `Facture mensuelle Gadz'Connect — ${input.billingPeriodLabel}`;
  const attachmentName =
    input.downloadFilename?.trim() ||
    `facture-mensuelle-${input.invoiceNumber.replace(/\s+/g, "-")}.pdf`;
  const html = `
    <p>Bonjour ${input.parentName},</p>
    <p>Votre facture mensuelle consolidée pour <strong>${input.billingPeriodLabel}</strong> est disponible.</p>
    <p>Elle récapitule <strong>${input.lineCount}</strong> cours pour un total de <strong>${formatEuro(input.totalAmount)}</strong> (n° ${input.invoiceNumber}).</p>
    <p>Vous trouverez le détail en pièce jointe.</p>
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
      to: [input.to],
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
    console.error("[billing] envoi facture mensuelle parent:", res.status, body);
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${res.status}`,
    };
  }

  return { sent: true, skipped: false };
}
