import PDFDocument from "pdfkit";
import type { PlatformBillingConfig } from "../billing/platform-config.js";
import {
  formatEuro,
  formatFrenchDate,
  formatSiretDisplay,
} from "../billing/format.js";
import type { ProviderUrssafSynthesis } from "../billing/provider-monthly-urssaf.js";
import {
  drawHorizontalRule,
  ensureSpace,
  writeBody,
  writeSectionTitle,
  writeTitle,
} from "./pdf-layout.js";

export interface MonthlyProviderSummaryLine {
  scheduledAt: string | null;
  subject: string;
  amount: number;
  invoiceNumber: string;
}

export interface MonthlyProviderSummaryInput {
  summaryNumber: string;
  invoiceDate: string;
  billingPeriodLabel: string;
  platform: PlatformBillingConfig;
  studentLegalName: string;
  studentSiret: string;
  studentAddress: string;
  lines: MonthlyProviderSummaryLine[];
  totalAmount: number;
  urssafSynthesis?: ProviderUrssafSynthesis;
}

/** @deprecated Utiliser MonthlyProviderSummaryLine */
export type MonthlyProviderSummaryLineLegacy = MonthlyProviderSummaryLine;

/** @deprecated Utiliser MonthlyProviderSummaryInput */
export type MonthlyStudentInvoiceLine = MonthlyProviderSummaryLine;
export type MonthlyStudentInvoiceInput = MonthlyProviderSummaryInput & {
  invoiceNumber: string;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_DATE = 50;
const COL_SUBJECT = 110;
const COL_INVOICE = 300;
const COL_AMOUNT = 480;

function writePartyBlock(doc: PdfDoc, title: string, lines: string[]): void {
  writeSectionTitle(doc, title);
  for (const line of lines) {
    writeBody(doc, line);
  }
  doc.moveDown(0.5);
}

function drawTableHeader(doc: PdfDoc): void {
  ensureSpace(doc, 24);
  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A");
  doc.text("Date", COL_DATE, y);
  doc.text("Prestation", COL_SUBJECT, y);
  doc.text("Facture", COL_INVOICE, y);
  doc.text("Montant HT", COL_AMOUNT, y, { width: 70, align: "right" });
  doc.moveDown(0.6);
  drawHorizontalRule(doc);
}

function drawTableRow(doc: PdfDoc, line: MonthlyProviderSummaryLine): void {
  ensureSpace(doc, 28);
  const y = doc.y;
  const dateLabel = line.scheduledAt
    ? formatFrenchDate(line.scheduledAt)
    : "—";

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text(dateLabel, COL_DATE, y, { width: 72 });
  doc.text(line.subject, COL_SUBJECT, y, { width: 180 });
  doc.text(line.invoiceNumber, COL_INVOICE, y, { width: 170 });
  doc.text(formatEuro(line.amount), COL_AMOUNT, y, {
    width: 70,
    align: "right",
  });
  doc.moveDown(0.8);
}

function drawUrssafSynthesisRow(
  doc: PdfDoc,
  label: string,
  value: string,
  bold = false,
): void {
  ensureSpace(doc, 22);
  const y = doc.y;
  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(9)
    .fillColor(bold ? "#0F172A" : "#334155");
  doc.text(label, 50, y, { width: 320 });
  doc.text(value, 380, y, { width: 165, align: "right" });
  doc.moveDown(0.55);
}

function drawUrssafSynthesisBlock(
  doc: PdfDoc,
  synthesis: ProviderUrssafSynthesis,
): void {
  writeSectionTitle(doc, "Synthèse URSSAF");
  writeBody(
    doc,
    "Montants calculés à partir des paiements enregistrés sur la période. À utiliser comme aide pour votre déclaration — vérifiez avec votre espace URSSAF.",
  );
  doc.moveDown(0.35);

  drawUrssafSynthesisRow(
    doc,
    "Nombre de cours facturés",
    String(synthesis.courseCount),
  );
  drawUrssafSynthesisRow(
    doc,
    "Chiffre d'affaires facturé HT",
    formatEuro(synthesis.totalInvoicedHt),
  );
  drawUrssafSynthesisRow(
    doc,
    "Montant payé par les parents (TTC)",
    formatEuro(synthesis.totalPaidParentTtc),
  );
  drawUrssafSynthesisRow(
    doc,
    "Commission Gadz'Connect",
    formatEuro(synthesis.totalCommission),
  );
  drawUrssafSynthesisRow(
    doc,
    "Base cotisable URSSAF (après commission)",
    formatEuro(synthesis.totalBaseAfterCommission),
  );
  drawUrssafSynthesisRow(doc, "Profil fiscal", synthesis.fiscalProfileLabel);
  drawUrssafSynthesisRow(doc, "Taux appliqué", synthesis.urssafRateLabel);
  drawUrssafSynthesisRow(
    doc,
    synthesis.cotisationsLabel,
    formatEuro(synthesis.totalUrssafCotisations),
  );
  drawUrssafSynthesisRow(
    doc,
    "Net versé sur la période",
    formatEuro(synthesis.totalNetPayout),
    true,
  );
  drawUrssafSynthesisRow(
    doc,
    "Périodicité de déclaration URSSAF",
    synthesis.urssafPeriodicityLabel,
  );
  doc.moveDown(0.5);
}

function buildProviderSummaryPdfContent(
  doc: PdfDoc,
  input: MonthlyProviderSummaryInput,
): void {
  writeTitle(doc, "RELEVÉ MENSUEL D'ACTIVITÉ");
  doc.moveDown(0.3);
  writeBody(doc, `N° ${input.summaryNumber}`);
  writeBody(doc, `Date d'émission : ${input.invoiceDate}`);
  writeBody(doc, `Période : ${input.billingPeriodLabel}`);
  writeBody(
    doc,
    `${input.urssafSynthesis?.courseCount ?? input.lines.length} cours facturé(s) sur la période`,
  );
  doc.moveDown(0.8);
  drawHorizontalRule(doc);

  writePartyBlock(doc, "Auto-entrepreneur", [
    input.studentLegalName,
    `SIRET : ${formatSiretDisplay(input.studentSiret)}`,
    input.studentAddress,
  ]);

  writePartyBlock(doc, "Plateforme", [
    input.platform.legalName,
    input.platform.address,
    `N° SAP : ${input.platform.sapNumber}`,
  ]);

  writeSectionTitle(doc, "Factures émises au cours du mois");
  writeBody(
    doc,
    "Ce document récapitule les factures déjà émises à chaque paiement. Il ne remplace pas les factures individuelles jointes aux e-mails de paiement.",
  );
  doc.moveDown(0.4);

  drawTableHeader(doc);
  for (const line of input.lines) {
    drawTableRow(doc, line);
  }

  ensureSpace(doc, 50);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#0F172A")
    .text(`Total HT facturé : ${formatEuro(input.totalAmount)}`, {
      align: "right",
    });
  doc.moveDown(0.8);

  if (input.urssafSynthesis) {
    drawHorizontalRule(doc);
    drawUrssafSynthesisBlock(doc, input.urssafSynthesis);
  }

  writeSectionTitle(doc, "Mentions");
  writeBody(doc, "TVA non applicable, art. 293 B du CGI.");
  doc.moveDown(1);

  ensureSpace(doc, 30);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94A3B8")
    .text(
      "Relevé mensuel à conserver pour la déclaration URSSAF de l'auto-entreprise.",
      { align: "center" },
    );
}

export function buildMonthlyProviderSummaryPdf(
  input: MonthlyProviderSummaryInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    buildProviderSummaryPdfContent(doc, input);
    doc.end();
  });
}

/** @deprecated Utiliser buildMonthlyProviderSummaryPdf */
export function buildMonthlyStudentInvoicePdf(
  input: MonthlyStudentInvoiceInput,
): Promise<Buffer> {
  return buildMonthlyProviderSummaryPdf({
    ...input,
    summaryNumber: input.invoiceNumber,
  });
}
