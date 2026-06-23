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

export interface MonthlyParentInvoiceLine {
  scheduledAt: string | null;
  endsAt: string | null;
  subject: string;
  tutorName: string;
  amount: number;
}

export interface MonthlyParentInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  billingPeriodLabel: string;
  platform: PlatformBillingConfig;
  parentName: string;
  lines: MonthlyParentInvoiceLine[];
  totalAmount: number;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_DATE = 50;
const COL_SUBJECT = 130;
const COL_TUTOR = 300;
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
  doc.text("Professeur", COL_TUTOR, y);
  doc.text("Montant", COL_AMOUNT, y, { width: 70, align: "right" });
  doc.moveDown(0.6);
  drawHorizontalRule(doc);
}

function drawTableRow(doc: PdfDoc, line: MonthlyParentInvoiceLine): void {
  ensureSpace(doc, 36);
  const y = doc.y;
  const dateLabel = line.scheduledAt
    ? formatFrenchDate(line.scheduledAt)
    : "—";
  const timeLabel = formatFrenchDateTimeRange(line.scheduledAt, line.endsAt);

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text(dateLabel, COL_DATE, y, { width: 72 });
  doc.text(line.subject, COL_SUBJECT, y, { width: 160 });
  doc.text(line.tutorName, COL_TUTOR, y, { width: 170 });
  doc.text(formatEuro(line.amount), COL_AMOUNT, y, {
    width: 70,
    align: "right",
  });
  doc.fontSize(7.5).fillColor("#64748B");
  doc.text(timeLabel, COL_SUBJECT, y + 12, { width: 400 });
  doc.moveDown(1.2);
}

export function buildMonthlyParentInvoicePdf(
  input: MonthlyParentInvoiceInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = input.platform.logoPath;
    if (logoPath && existsSync(logoPath)) {
      doc.image(logoPath, doc.page.margins.left, doc.y, { width: 72 });
      doc.moveDown(3.2);
    }

    writeTitle(doc, "FACTURE MENSUELLE");
    doc.moveDown(0.3);
    writeBody(doc, `N° ${input.invoiceNumber}`);
    writeBody(doc, `Date d'émission : ${input.invoiceDate}`);
    writeBody(doc, `Période facturée : ${input.billingPeriodLabel}`);
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

    writePartyBlock(doc, "Émetteur", platformLines);
    writePartyBlock(doc, "Client (parent payeur)", [input.parentName]);

    writeSectionTitle(doc, "Récapitulatif des cours particuliers");
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

    writeSectionTitle(doc, "Mentions légales");
    writeBody(
      doc,
      "Activité exercée sous le régime de la déclaration des Services à la Personne.",
    );
    if (input.platform.vatApplicable) {
      writeBody(
        doc,
        `TVA applicable au taux de ${input.platform.vatRate} %.`,
      );
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
        "Facture mensuelle consolidée générée automatiquement par Gadz'Connect.",
        { align: "center" },
      );

    doc.end();
  });
}
