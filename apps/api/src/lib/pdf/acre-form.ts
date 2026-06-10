import PDFDocument from "pdfkit";

export interface AcreFormInput {
  firstName: string;
  lastName: string;
  activity: string;
  email: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  enseignement: "Enseignement / formation",
  conseil: "Conseil",
  prestation_intellectuelle: "Prestation intellectuelle",
};

export function buildAcreFormPdf(input: AcreFormInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Demande ACRE — Récapitulatif pré-rempli");
    doc.moveDown();
    doc.fontSize(11).fillColor("#444").text("À joindre à votre dossier URSSAF");
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#000").text("Identité du demandeur");
    doc.fontSize(11).text(`Nom : ${input.lastName}`);
    doc.text(`Prénom : ${input.firstName}`);
    doc.text(`E-mail : ${input.email}`);
    doc.moveDown();

    doc.fontSize(14).text("Activité déclarée");
    doc
      .fontSize(11)
      .text(`→ ${ACTIVITY_LABELS[input.activity] ?? input.activity}`);
    doc.text("→ Statut visé : Micro-entrepreneur");
    doc.moveDown();

    doc.fontSize(14).text("Réduction ACRE (1ère année)");
    doc.fontSize(11);
    doc.text("→ Taux réduit de cotisations : environ 50 % la première année");
    doc.text("→ Éligibilité : création d'activité, sous conditions URSSAF");
    doc.moveDown();

    doc.fontSize(14).text("Étapes à suivre");
    doc.fontSize(11);
    [
      "Télécharger le formulaire officiel sur autoentrepreneur.urssaf.fr",
      "Joindre ce récapitulatif Gadz'Connect comme aide-mémoire",
      "Envoyer la demande dans les 45 jours suivant la création",
      "Cocher « Demande d'ACRE » sur le Guichet Unique si proposé",
    ].forEach((step, i) => doc.text(`${i + 1}. ${step}`));

    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "Document généré par Gadz'Connect — ne remplace pas le formulaire officiel URSSAF.",
      );

    doc.end();
  });
}
