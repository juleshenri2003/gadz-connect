import { existsSync } from "node:fs";
import PDFDocument from "pdfkit";
import type { PlatformBillingConfig } from "../billing/platform-config.js";
import {
  formatEuro,
  formatFrenchDate,
  formatFrenchDateTimeRange,
  formatSiretDisplay,
} from "../billing/format.js";
import {
  drawHorizontalRule,
  ensureSpace,
  writeBody,
  writeSectionTitle,
  writeTitle,
} from "./pdf-layout.js";

export interface MonthlyParentSummaryLine {
  scheduledAt: string | null;
  endsAt: string | null;
  subject: string;
  tutorName: string;
  amount: number;
  invoiceNumber: string;
}

export interface MonthlyParentSummaryInput {
  summaryNumber: string;
  invoiceDate: string;
  billingPeriodLabel: string;
  platform: PlatformBillingConfig;
  parentName: string;
  lines: MonthlyParentSummaryLine[];
  totalAmount: number;
}

/** @deprecated Utiliser MonthlyParentSummaryLine */
export type MonthlyParentInvoiceLine = MonthlyParentSummaryLine;
export type MonthlyParentInvoiceInput = MonthlyParentSummaryInput & {
  invoiceNumber: string;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_DATE = 50;
const COL_SUBJECT = 110;
const COL_TUTOR = 250;
const COL_INVOICE = 370;
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
  doc.text("Cours", COL_SUBJECT, y);
  doc.text("Prof.", COL_TUTOR, y);
  doc.text("Facture", COL_INVOICE, y);
  doc.text("Montant", COL_AMOUNT, y, { width: 70, align: "right" });
  doc.moveDown(0.6);
  drawHorizontalRule(doc);
}

function drawTableRow(doc: PdfDoc, line: MonthlyParentSummaryLine): void {
  ensureSpace(doc, 36);
  const y = doc.y;
  const dateLabel = line.scheduledAt
    ? formatFrenchDate(line.scheduledAt)
    : "—";
  const timeLabel = formatFrenchDateTimeRange(line.scheduledAt, line.endsAt);

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text(dateLabel, COL_DATE, y, { width: 72 });
  doc.text(line.subject, COL_SUBJECT, y, { width: 130 });
  doc.text(line.tutorName, COL_TUTOR, y, { width: 110 });
  doc.text(line.invoiceNumber, COL_INVOICE, y, { width: 100 });
  doc.text(formatEuro(line.amount), COL_AMOUNT, y, {
    width: 70,
    align: "right",
  });
  doc.fontSize(7.5).fillColor("#64748B");
  doc.text(timeLabel, COL_SUBJECT, y + 12, { width: 400 });
  doc.moveDown(1.2);
}

function buildParentSummaryPdfContent(
  doc: PdfDoc,
  input: MonthlyParentSummaryInput,
): void {
  const logoPath = input.platform.logoPath;
  if (logoPath && existsSync(logoPath)) {
    doc.image(logoPath, doc.page.margins.left, doc.y, { width: 72 });
    doc.moveDown(3.2);
  }

  writeTitle(doc, "RELEVÉ MENSUEL DES FACTURES");
  doc.moveDown(0.3);
  writeBody(doc, `N° ${input.summaryNumber}`);
  writeBody(doc, `Date d'émission : ${input.invoiceDate}`);
  writeBody(doc, `Période : ${input.billingPeriodLabel}`);
  doc.moveDown(0.8);
  drawHorizontalRule(doc);

  const platformLines = [
    input.platform.legalName,
    input.platform.address,
    `N° SAP : ${input.platform.sapNumber}`,
  ];
  if (input.platform.siret) {
    platformLines.push(`SIRET : ${formatSiretDisplay(input.platform.siret)}`);
  }

  writePartyBlock(doc, "Plateforme", platformLines);
  writePartyBlock(doc, "Parent payeur", [input.parentName]);

  writeSectionTitle(doc, "Factures émises au cours du mois");
  writeBody(
    doc,
    "Ce document récapitule les factures déjà émises à chaque paiement. Il ne remplace pas les factures individuelles.",
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
    .text(`Total TTC : ${formatEuro(input.totalAmount)}`, { align: "right" });
  doc.moveDown(0.8);

  writeSectionTitle(doc, "Mentions");
  writeBody(
    doc,
    "Activité exercée sous le régime de la déclaration des Services à la Personne.",
  );
  if (input.platform.vatApplicable) {
    writeBody(doc, `TVA applicable au taux de ${input.platform.vatRate} %.`);
  } else {
    writeBody(doc, "TVA non applicable — association loi 1901.");
  }
  doc.moveDown(1);

  ensureSpace(doc, 30);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94A3B8")
    .text(
      "Relevé mensuel généré automatiquement par Gadz'Connect.",
      { align: "center" },
    );
}

export function buildMonthlyParentSummaryPdf(
  input: MonthlyParentSummaryInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    buildParentSummaryPdfContent(doc, input);
    doc.end();
  });
}

/** @deprecated Utiliser buildMonthlyParentSummaryPdf */
export function buildMonthlyParentInvoicePdf(
  input: MonthlyParentInvoiceInput,
): Promise<Buffer> {
  return buildMonthlyParentSummaryPdf({
    ...input,
    summaryNumber: input.invoiceNumber,
  });
}
