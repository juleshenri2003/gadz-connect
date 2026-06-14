import PDFDocument from "pdfkit";
import type { PlatformBillingConfig } from "../billing/platform-config.js";
import {
  formatEuro,
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

export interface StudentInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  platform: PlatformBillingConfig;
  studentLegalName: string;
  studentSiret: string;
  studentAddress: string;
  subject: string;
  scheduledAt: string | null;
  endsAt: string | null;
  amount: number;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function writePartyBlock(
  doc: PdfDoc,
  title: string,
  lines: string[],
): void {
  writeSectionTitle(doc, title);
  for (const line of lines) {
    writeBody(doc, line);
  }
  doc.moveDown(0.5);
}

export function buildStudentInvoicePdf(
  input: StudentInvoiceInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeTitle(doc, "FACTURE");
    doc.moveDown(0.3);
    writeBody(doc, `N° ${input.invoiceNumber}`, { indent: 0 });
    writeBody(doc, `Date d'émission : ${input.invoiceDate}`);
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

    writeSectionTitle(doc, "Prestation de cours");
    writeBody(doc, `Objet : ${input.subject}`);
    writeBody(
      doc,
      `Date et horaires : ${formatFrenchDateTimeRange(input.scheduledAt, input.endsAt)}`,
    );
    doc.moveDown(0.5);

    writeSectionTitle(doc, "Montant");
    ensureSpace(doc, 60);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#0F172A")
      .text(`Total HT : ${formatEuro(input.amount)}`);
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
        "Facture émise par l'auto-entreprise de l'étudiant prestataire — à conserver pour la comptabilité URSSAF.",
        { align: "center" },
      );

    doc.end();
  });
}
