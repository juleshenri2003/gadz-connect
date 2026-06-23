import PDFDocument from "pdfkit";
import type { PlatformBillingConfig } from "../billing/platform-config.js";
import {
  formatEuro,
  formatFrenchDate,
  formatSiretDisplay,
} from "../billing/format.js";
import {
  drawHorizontalRule,
  ensureSpace,
  writeBody,
  writeSectionTitle,
  writeTitle,
} from "./pdf-layout.js";

export interface MonthlyStudentInvoiceLine {
  scheduledAt: string | null;
  subject: string;
  amount: number;
}

export interface MonthlyStudentInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  billingPeriodLabel: string;
  platform: PlatformBillingConfig;
  studentLegalName: string;
  studentSiret: string;
  studentAddress: string;
  lines: MonthlyStudentInvoiceLine[];
  totalAmount: number;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_DATE = 50;
const COL_SUBJECT = 130;
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
  doc.text("Montant HT", COL_AMOUNT, y, { width: 70, align: "right" });
  doc.moveDown(0.6);
  drawHorizontalRule(doc);
}

function drawTableRow(doc: PdfDoc, line: MonthlyStudentInvoiceLine): void {
  ensureSpace(doc, 28);
  const y = doc.y;
  const dateLabel = line.scheduledAt
    ? formatFrenchDate(line.scheduledAt)
    : "—";

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text(dateLabel, COL_DATE, y, { width: 72 });
  doc.text(line.subject, COL_SUBJECT, y, { width: 330 });
  doc.text(formatEuro(line.amount), COL_AMOUNT, y, {
    width: 70,
    align: "right",
  });
  doc.moveDown(0.8);
}

export function buildMonthlyStudentInvoicePdf(
  input: MonthlyStudentInvoiceInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeTitle(doc, "NOTE DE DÉBOURS MENSUELLE");
    doc.moveDown(0.3);
    writeBody(doc, `N° ${input.invoiceNumber}`);
    writeBody(doc, `Date d'émission : ${input.invoiceDate}`);
    writeBody(doc, `Période : ${input.billingPeriodLabel}`);
    doc.moveDown(0.8);
    drawHorizontalRule(doc);

    writePartyBlock(doc, "Émetteur (auto-entrepreneur)", [
      input.studentLegalName,
      `SIRET : ${formatSiretDisplay(input.studentSiret)}`,
      input.studentAddress,
    ]);

    writePartyBlock(doc, "Destinataire", [
      input.platform.legalName,
      input.platform.address,
      `N° SAP : ${input.platform.sapNumber}`,
    ]);

    writeSectionTitle(doc, "Prestations de service");
    writeBody(
      doc,
      "Soutien scolaire / cours particuliers réalisés pour le compte de la plateforme Gadz'Connect.",
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
      .text(`Total HT : ${formatEuro(input.totalAmount)}`, { align: "right" });
    doc.moveDown(0.8);

    writeSectionTitle(doc, "Mentions légales");
    writeBody(doc, "TVA non applicable, art. 293 B du CGI.");
    doc.moveDown(1);

    ensureSpace(doc, 30);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#94A3B8")
      .text(
        "Document mensuel à conserver pour la déclaration URSSAF de l'auto-entreprise.",
        { align: "center" },
      );

    doc.end();
  });
}
