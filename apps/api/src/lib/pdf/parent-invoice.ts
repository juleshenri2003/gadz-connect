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

export interface ParentInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  platform: PlatformBillingConfig;
  parentName: string;
  tutorName: string;
  subject: string;
  scheduledAt: string | null;
  endsAt: string | null;
  amountGross: number;
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

export function buildParentInvoicePdf(
  input: ParentInvoiceInput,
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

    const platformLines = [
      input.platform.legalName,
      input.platform.address,
      `N° SAP : ${input.platform.sapNumber}`,
    ];
    if (input.platform.siret) {
      platformLines.push(`SIRET : ${formatSiretDisplay(input.platform.siret)}`);
    }

    writePartyBlock(doc, "Émetteur", platformLines);
    writePartyBlock(doc, "Client (parent)", [input.parentName]);

    writeSectionTitle(doc, "Prestation de cours");
    writeBody(doc, `Professeur : ${input.tutorName}`);
    writeBody(doc, `Matière / objet : ${input.subject}`);
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
      .text(`Total TTC : ${formatEuro(input.amountGross)}`);
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
        "Document généré automatiquement par Gadz'Connect à réception du paiement.",
        { align: "center" },
      );

    doc.end();
  });
}
