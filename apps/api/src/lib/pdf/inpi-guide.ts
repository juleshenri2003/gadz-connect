import PDFDocument from "pdfkit";

export interface InpiGuideInput {
  firstName: string;
  lastName: string;
  activity: string;
  urssafPeriodicity: string;
  versementLiberatoire: boolean;
  statusAcre: boolean;
}

const ACTIVITY_LABELS: Record<string, string> = {
  enseignement: "Enseignement / cours particuliers (code APE 85.59W)",
  conseil: "Conseil et accompagnement",
  prestation_intellectuelle: "Prestation intellectuelle (BNC)",
};

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
};

export function buildInpiGuidePdf(input: InpiGuideInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .text("Gadz'Connect — Guide Guichet Unique INPI", { underline: true });
    doc.moveDown();
    doc
      .fontSize(11)
      .fillColor("#444")
      .text(
        `Personnalisé pour ${input.firstName} ${input.lastName} — ${new Date().toLocaleDateString("fr-FR")}`,
      );
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#000").text("1. Type de création");
    doc.fontSize(11).text("→ Création d'une micro-entreprise (auto-entrepreneur)");
    doc.moveDown();

    doc.fontSize(14).text("2. Activité principale");
    doc
      .fontSize(11)
      .text(`→ ${ACTIVITY_LABELS[input.activity] ?? input.activity}`);
    doc.text("→ Nature : Service (BNC si prestation intellectuelle)");
    doc.moveDown();

    doc.fontSize(14).text("3. Régime fiscal et social");
    doc.fontSize(11).text("→ Régime micro-entreprise");
    doc.text(
      `→ Déclaration URSSAF : ${PERIODICITY_LABELS[input.urssafPeriodicity] ?? input.urssafPeriodicity}`,
    );
    doc.text(
      `→ Versement libératoire de l'impôt : ${input.versementLiberatoire ? "OUI — cocher l'option" : "NON — ne pas cocher"}`,
    );
    doc.text(
      `→ ACRE (réduction 1ère année) : ${input.statusAcre ? "Demander l'ACRE (voir formulaire joint)" : "Non demandé"}`,
    );
    doc.moveDown();

    doc.fontSize(14).text("4. Cases à cocher sur le Guichet Unique");
    doc.fontSize(11);
    const steps = [
      "Nature juridique : Entrepreneur individuel (micro-entreprise)",
      "Activité : selon votre choix ci-dessus",
      "Option pour le versement libératoire : selon votre choix ci-dessus",
      "Périodicité des déclarations : selon votre choix ci-dessus",
      "Adresse du domicile : votre adresse personnelle actuelle",
    ];
    steps.forEach((step, i) => doc.text(`${i + 1}. ${step}`));
    doc.moveDown();

    doc.fontSize(14).text("5. Après validation INSEE");
    doc
      .fontSize(11)
      .text(
        "Vous recevrez votre numéro SIRET sous 1 à 3 semaines. Reconnectez-vous sur Gadz'Connect et saisissez-le dans l'onglet Micro-entreprise pour activer les paiements.",
      );
    doc.moveDown();

    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "Note : ce document est un guide indicatif. Gadz'Connect ne crée pas l'entreprise à votre place. Vous restez responsable de votre déclaration sur formalites.entreprises.gouv.fr.",
      );

    doc.end();
  });
}
