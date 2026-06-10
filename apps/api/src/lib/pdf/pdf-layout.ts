import type PDFKit from "pdfkit";

type PdfDoc = PDFKit.PDFDocument;

const MARGIN = 50;
const BODY_SIZE = 10.5;
const TITLE_SIZE = 16;
const SECTION_SIZE = 13;
const SUBSECTION_SIZE = 11.5;

export function contentWidth(doc: PdfDoc): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

export function ensureSpace(
  doc: PdfDoc,
  needed: number,
): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

export function drawHorizontalRule(doc: PDFKit.PDFDocument): void {
  ensureSpace(doc, 16);
  const y = doc.y + 4;
  doc
    .strokeColor("#CBD5E1")
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke();
  doc.moveDown(0.8);
}

export function writeTitle(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 40);
  doc
    .font("Helvetica-Bold")
    .fontSize(TITLE_SIZE)
    .fillColor("#0F172A")
    .text(text, { align: "center" });
  doc.moveDown(0.6);
}

export function writeSectionTitle(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 36);
  doc
    .font("Helvetica-Bold")
    .fontSize(SECTION_SIZE)
    .fillColor("#0F172A")
    .text(text);
  doc.moveDown(0.4);
}

export function writeSubsectionTitle(
  doc: PdfDoc,
  text: string,
): void {
  ensureSpace(doc, 28);
  doc
    .font("Helvetica-Bold")
    .fontSize(SUBSECTION_SIZE)
    .fillColor("#1E293B")
    .text(text);
  doc.moveDown(0.25);
}

export function writeBody(
  doc: PdfDoc,
  text: string,
  options?: { indent?: number; continued?: boolean },
): void {
  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#334155")
    .text(text, {
      width: contentWidth(doc) - (options?.indent ?? 0),
      indent: options?.indent,
      align: "left",
      continued: options?.continued,
    });
}

export function writeBulletList(
  doc: PdfDoc,
  items: string[],
): void {
  for (const item of items) {
    ensureSpace(doc, 24);
    writeBody(doc, `• ${item}`, { indent: 12 });
    doc.moveDown(0.15);
  }
}

export function writeNumberedList(
  doc: PdfDoc,
  items: string[],
): void {
  items.forEach((item, index) => {
    ensureSpace(doc, 24);
    writeBody(doc, `${index + 1}. ${item}`, { indent: 8 });
    doc.moveDown(0.15);
  });
}

export function writeLinkLine(
  doc: PdfDoc,
  label: string,
  url: string,
): void {
  ensureSpace(doc, 20);
  writeBody(doc, `${label} : `, { continued: true });
  doc.fillColor("#4338CA").text(url, { link: url, underline: true });
  doc.fillColor("#334155");
  doc.moveDown(0.2);
}

export function writeAlertBox(
  doc: PdfDoc,
  title: string,
  paragraphs: string[],
): void {
  const width = contentWidth(doc);
  const padding = 14;
  const lineHeight = 14;
  const estimatedHeight =
    padding * 2 + lineHeight * (paragraphs.length + 1) + 8;
  ensureSpace(doc, estimatedHeight + 10);

  const x = doc.page.margins.left;
  const y = doc.y;

  doc.save();
  doc.roundedRect(x, y, width, estimatedHeight, 6).fill("#FEE2E2");
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#991B1B")
    .text(title, x + padding, y + padding, { width: width - padding * 2 });

  let textY = y + padding + lineHeight + 4;
  doc.font("Helvetica").fontSize(BODY_SIZE).fillColor("#7F1D1D");
  for (const paragraph of paragraphs) {
    doc.text(paragraph, x + padding, textY, {
      width: width - padding * 2,
      lineGap: 2,
    });
    textY = doc.y + 6;
  }

  doc.y = y + estimatedHeight + 12;
  doc.fillColor("#334155");
}

export function writeInfoBox(
  doc: PdfDoc,
  title: string,
  paragraphs: string[],
): void {
  const width = contentWidth(doc);
  const padding = 14;
  const lineHeight = 13;
  const estimatedHeight =
    padding * 2 + lineHeight * (paragraphs.length + 1) + 8;
  ensureSpace(doc, estimatedHeight + 10);

  const x = doc.page.margins.left;
  const y = doc.y;

  doc.save();
  doc.roundedRect(x, y, width, estimatedHeight, 6).fill("#ECFDF5");
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#065F46")
    .text(title, x + padding, y + padding, { width: width - padding * 2 });

  let textY = y + padding + lineHeight + 2;
  doc.font("Helvetica").fontSize(BODY_SIZE).fillColor("#14532D");
  for (const paragraph of paragraphs) {
    doc.text(paragraph, x + padding, textY, {
      width: width - padding * 2,
      lineGap: 2,
    });
    textY = doc.y + 4;
  }

  doc.y = y + estimatedHeight + 12;
  doc.fillColor("#334155");
}

export function writeCoverPage(
  doc: PdfDoc,
  options: {
    subtitle: string;
    authorLine: string;
    contactLine: string;
    personalizedFor: string;
    dateLabel: string;
  },
): void {
  doc.moveDown(2);
  writeTitle(doc, "Devenir auto-entrepreneur");
  writeTitle(doc, "pour donner des cours");
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#4338CA")
    .text("Gadz'Connect — Arts et Métiers", { align: "center" });
  doc.moveDown(1.5);

  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#64748B")
    .text(options.subtitle, { align: "center" });
  doc.moveDown(2);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0F172A")
    .text(options.personalizedFor, { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#64748B")
    .text(options.dateLabel, { align: "center" });
  doc.moveDown(2.5);

  drawHorizontalRule(doc);

  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#475569")
    .text(options.authorLine, { align: "center" });
  doc.text(options.contactLine, { align: "center" });
  doc.addPage();
}

export { MARGIN, BODY_SIZE };
