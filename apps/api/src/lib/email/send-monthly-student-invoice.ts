import {
  getPlatformEmailFrom,
  getResendApiKey,
  resolveEmailRecipient,
} from "./resend-config.js";
import type { ProviderUrssafSynthesis } from "../billing/provider-monthly-urssaf.js";

export interface SendMonthlyProviderSummaryEmailInput {
  to: string;
  studentName: string;
  summaryNumber: string;
  billingPeriodLabel: string;
  totalAmount: number;
  lineCount: number;
  pdfBuffer: Buffer;
  downloadFilename?: string;
  urssafSynthesis?: ProviderUrssafSynthesis;
}

/** @deprecated Utiliser SendMonthlyProviderSummaryEmailInput */
export type SendMonthlyStudentInvoiceEmailInput = Omit<
  SendMonthlyProviderSummaryEmailInput,
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

export async function sendMonthlyProviderSummaryEmail(
  input: SendMonthlyProviderSummaryEmailInput,
): Promise<SendMonthlyInvoiceEmailResult> {
  const apiKey = getResendApiKey();
  const from = getPlatformEmailFrom();

  if (!apiKey) {
    console.warn(
      "[billing] RESEND_API_KEY absent — relevé mensuel prof non envoyé",
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
  const urssafBlock = input.urssafSynthesis
    ? `<p><strong>Synthèse URSSAF (${input.billingPeriodLabel})</strong></p>
    <ul>
      <li>${input.urssafSynthesis.courseCount} cours — CA HT facturé : <strong>${formatEuro(input.urssafSynthesis.totalInvoicedHt)}</strong></li>
      <li>Base cotisable : ${formatEuro(input.urssafSynthesis.totalBaseAfterCommission)} — profil ${input.urssafSynthesis.fiscalProfileLabel}</li>
      <li>${input.urssafSynthesis.cotisationsLabel} : <strong>${formatEuro(input.urssafSynthesis.totalUrssafCotisations)}</strong></li>
      <li>Net versé : <strong>${formatEuro(input.urssafSynthesis.totalNetPayout)}</strong></li>
    </ul>
    <p>Le détail complet figure dans le PDF joint.</p>`
    : "";
  const html = `
    <p>Bonjour ${input.studentName},</p>
    <p>Votre relevé mensuel d'activité pour <strong>${input.billingPeriodLabel}</strong> est disponible.</p>
    <p>Il récapitule <strong>${input.lineCount}</strong> facture(s) déjà émises à chaque paiement, pour un total HT de <strong>${formatEuro(input.totalAmount)}</strong> (n° ${input.summaryNumber}).</p>
    ${urssafBlock}
    <p>Conservez ce document pour votre déclaration URSSAF. Les factures individuelles restent disponibles dans votre espace Gadz'Connect.</p>
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
    console.error("[billing] envoi relevé mensuel prof:", res.status, body);
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${res.status}`,
    };
  }

  if (redirected) {
    console.info(
      `[billing] relevé prof ${input.summaryNumber} → ${to} (dev, prévu ${input.to})`,
    );
  }

  return { sent: true, skipped: false };
}

/** @deprecated Utiliser sendMonthlyProviderSummaryEmail */
export async function sendMonthlyStudentInvoiceEmail(
  input: SendMonthlyStudentInvoiceEmailInput,
): Promise<SendMonthlyInvoiceEmailResult> {
  return sendMonthlyProviderSummaryEmail({
    ...input,
    summaryNumber: input.invoiceNumber,
  });
}
