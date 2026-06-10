import PDFDocument from "pdfkit";

type PdfDoc = InstanceType<typeof PDFDocument>;
import {
  drawHorizontalRule,
  ensureSpace,
  writeAlertBox,
  writeBody,
  writeBulletList,
  writeCoverPage,
  writeInfoBox,
  writeLinkLine,
  writeNumberedList,
  writeSectionTitle,
  writeSubsectionTitle,
} from "./pdf-layout.js";

export interface InpiGuideInput {
  firstName: string;
  lastName: string;
  activity: string;
  urssafPeriodicity: string;
  versementLiberatoire: boolean;
  statusAcre: boolean;
}

const INPI_URL = "https://procedures.inpi.fr/";
const URSSAF_ACRE_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/demander-lacre.html";
const URSSAF_PORTAL_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html";

const RESPONSABLE = {
  name: "Jules Henri",
  role: "Responsable Gadz'Connect",
  phone: "07 82 01 96 76",
  email: "jules.henri@ensam.eu",
};

const ACTIVITY_LABELS: Record<string, string> = {
  enseignement: "Enseignement / cours particuliers — soutien scolaire (APE 85.59W)",
  conseil: "Conseil et accompagnement",
  prestation_intellectuelle: "Prestation intellectuelle (BNC)",
};

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle (recommandée)",
};

const SCAM_ALERT_LINES = [
  "Vous ne serez jamais amené à payer quoi que ce soit durant votre inscription ou après avoir obtenu votre statut d'auto-entrepreneur.",
  "Donner des cours est gratuit ! Les cotisations URSSAF ne commencent que lorsque vous encaissez de l'argent.",
  "Sans activité, déclarez 0 € de chiffre d'affaires — conserver le statut reste gratuit.",
  "Attention aux courriers demandant un paiement pour affichage publicitaire, CFE payante ou fausses amendes : c'est une arnaque.",
  `Dans le doute, contactez ${RESPONSABLE.name} au ${RESPONSABLE.phone}.`,
];

function writePersonalizedRecap(
  doc: PdfDoc,
  input: InpiGuideInput,
): void {
  writeSectionTitle(
    doc,
    "Votre récapitulatif personnalisé — à reproduire sur le Guichet Unique",
  );
  writeBody(
    doc,
    `Ce bloc reprend les choix enregistrés pour ${input.firstName} ${input.lastName} sur Gadz'Connect.`,
  );
  doc.moveDown(0.4);

  writeInfoBox(doc, "Cases à cocher sur l'INPI", [
    `Activité : ${ACTIVITY_LABELS[input.activity] ?? input.activity}`,
    "Chemin INPI : Activités de services → Enseignement → Autres enseignements → Soutien scolaire",
    "Nature juridique : Entrepreneur individuel (micro-entreprise)",
    `Périodicité URSSAF : ${PERIODICITY_LABELS[input.urssafPeriodicity] ?? input.urssafPeriodicity}`,
    `Versement libératoire : ${input.versementLiberatoire ? "OUI — cocher l'option" : "NON — ne pas cocher"}`,
    `ACRE (1ère année) : ${input.statusAcre ? "À demander (voir section ACRE)" : "Cocher NON au dépôt ACRE sur l'INPI si pas encore fait"}`,
    "Adresse : votre domicile personnel actuel",
  ]);
  doc.moveDown(0.3);
}

function writeReassuranceSection(doc: PdfDoc): void {
  writeSectionTitle(
    doc,
    "Pourquoi en France, on ne perd rien à devenir auto-entrepreneur en tant qu'étudiant ?",
  );
  writeBody(
    doc,
    "Devenir auto-entrepreneur tout en étant étudiant est une démarche simple et avantageuse. Ce statut n'entraîne pas de pertes significatives sur la bourse, la situation fiscale ou les impôts de vos parents.",
  );
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "1. La bourse étudiante reste inchangée");
  writeBulletList(doc, [
    "La bourse est calculée principalement sur les revenus de vos parents et le nombre d'enfants à charge.",
    "Tant que vous êtes rattaché au foyer fiscal de vos parents et que vos revenus restent modestes, votre éligibilité ne change pas.",
  ]);

  writeSubsectionTitle(doc, "2. La situation fiscale des parents reste stable");
  writeBulletList(doc, [
    "Vous continuez à compter pour une part dans le quotient familial.",
    "Vos revenus auto-entrepreneur sont les vôtres : ils n'augmentent pas directement les revenus imposables de vos parents.",
  ]);

  writeSubsectionTitle(doc, "3. Le versement libératoire : simple et pratique");
  writeBulletList(doc, [
    "Vous pouvez payer l'impôt au fur et à mesure (souvent trimestriellement) en pourcentage du chiffre d'affaires.",
    "Téléchargez l'application « AutoEntrepreneur URSSAF » pour faciliter calculs et paiements.",
    "Ce mode de paiement est indépendant des revenus de vos parents.",
  ]);

  writeSubsectionTitle(doc, "4. Avantages pour les étudiants");
  writeBulletList(doc, [
    "Cotisations uniquement sur le chiffre d'affaires réel, avec des taux réduits en micro-entreprise.",
    "Avec l'ACRE : environ 11 % la 1ère année, 19 % la 2ème, 22 % ensuite sur les cotisations.",
    "Pas d'impact sur la bourse ni les APL tant que vos gains restent sous la limite de 6 000 €.",
  ]);

  writeBody(
    doc,
    "En résumé : vous conservez vos avantages étudiants tout en gagnant en flexibilité et en expérience professionnelle.",
  );
  doc.moveDown(0.5);
}

function writePlatformSection(doc: PdfDoc): void {
  writeSectionTitle(
    doc,
    "Tuyss inscription cours particuliers en tant qu'auto-entrepreneur",
  );
  writeBody(
    doc,
    "Gadz'Connect est la plateforme inter-campus Arts et Métiers pour donner des cours particuliers facilement, être reconnu par l'État et proposer un cadre fiscal clair aux familles.",
  );
  doc.moveDown(0.3);
  writeBody(
    doc,
    "La seule condition pour proposer des cours sur la plateforme est d'être auto-entrepreneur. Tout ce que vous gagnez devra être déclaré à l'URSSAF par vous-même.",
  );
  doc.moveDown(0.3);
  writeBody(
    doc,
    `Des questions ? Contactez ${RESPONSABLE.name}, ${RESPONSABLE.role}, au ${RESPONSABLE.phone} ou ${RESPONSABLE.email}.`,
  );
  doc.moveDown(0.5);
}

function writeInpiWalkthrough(doc: PdfDoc, input: InpiGuideInput): void {
  writeSectionTitle(doc, "Devenir auto-entrepreneur — étapes INPI");
  writeBody(doc, "Sommaire des étapes à réaliser sur le Guichet Unique :");
  doc.moveDown(0.3);

  writeNumberedList(doc, [
    "Se rendre sur procedures.inpi.fr et créer une micro-entreprise.",
    "Répondre NON à « Devenir compte administrateur de mon entreprise » (FranceConnect si demandé).",
    "Choisir la démarche encadrée, accepter les conditions, sélectionner « Création d'entreprise ».",
    "Catégoriser l'activité : Activités de services → Enseignement → Autres enseignements → Soutien scolaire.",
    `Choisir la périodicité URSSAF : ${PERIODICITY_LABELS[input.urssafPeriodicity] ?? input.urssafPeriodicity}. Un oubli peut entraîner une amende URSSAF.`,
    "Si les démarches URSSAF ne sont pas faites : cocher NON au dépôt d'ACRE sur l'INPI.",
    "Téléverser une pièce d'identité (voir encadré ci-dessous).",
    "Envoyer le dossier et attendre le numéro SIRET (1 à 4 semaines).",
  ]);
  doc.moveDown(0.4);

  writeLinkLine(doc, "Guichet Unique INPI", INPI_URL);
  doc.moveDown(0.3);

  writeAlertBox(doc, "PIÈCE D'IDENTITÉ — OBLIGATOIRE", [
    "Avant de scanner votre CNI ou passeport, écrivez À LA MAIN sur le papier :",
    "1. « Je certifie sur l'honneur que cette photocopie est conforme à l'original. »",
    "2. La date du jour.",
    "3. Votre signature.",
    "Sans ces trois éléments manuscrits, le dossier peut être refusé.",
  ]);

  writeSubsectionTitle(doc, "Nom de dossier");
  writeBody(
    doc,
    "Le « nom de dossier » est un libellé interne sans impact une fois l'inscription terminée. En cas de doute sur une case, contactez le responsable avant de valider.",
  );
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Après l'envoi");
  writeBulletList(doc, [
    "Créez votre compte URSSAF si ce n'est pas déjà fait.",
    "Demandez l'ACRE sur le portail URSSAF si vous ne l'avez pas cochée à la création.",
    "Revenez sur Gadz'Connect pour saisir votre SIRET dès réception.",
  ]);
  writeLinkLine(doc, "Demander l'ACRE", URSSAF_ACRE_URL);
  doc.moveDown(0.3);
}

function writeAcreSection(doc: PdfDoc): void {
  ensureSpace(doc, 120);
  writeSectionTitle(doc, "Demander l'ACRE après coup (si besoin)");
  writeBody(
    doc,
    "Si vous n'avez pas coché l'ACRE à la création, ou si votre première déclaration URSSAF ne montre pas la réduction :",
  );
  doc.moveDown(0.3);
  writeNumberedList(doc, [
    "Aller sur autoentrepreneur.urssaf.fr",
    "Cliquer sur « Demander l'ACRE », puis « Guichet Unique », puis « Déclarer ».",
    "Se connecter avec votre espace vérifié et remplir le formulaire.",
    "Activer votre compte via l'e-mail reçu si nécessaire.",
    "Envoyer la demande avec les pièces jointes demandées.",
  ]);
  writeLinkLine(doc, "Portail URSSAF", URSSAF_PORTAL_URL);
  writeBody(
    doc,
    "La réduction ACRE dure 1 an et ne peut être demandée qu'une seule fois. Elle devrait apparaître à la prochaine déclaration URSSAF.",
  );
  doc.moveDown(0.4);
}

function writeInpiTipsSection(doc: PdfDoc): void {
  writeSectionTitle(doc, "Récupérer la synthèse de création sur l'INPI");
  writeBulletList(doc, [
    "Utilisez Mozilla Firefox (Safari sur Mac pose souvent problème).",
    "Connectez-vous sur procedures.inpi.fr avec le compte créé.",
    "Acceptez la page d'accueil, puis cherchez « synthèse de création d'entreprise/activité » dans votre espace.",
  ]);
  writeLinkLine(doc, "Espace INPI", `${INPI_URL}?/`);
  doc.moveDown(0.3);
}

function writeCfeSection(doc: PdfDoc): void {
  writeSectionTitle(doc, "Le seul courrier papier légitime : la CFE (1447-C-K)");
  writeAlertBox(doc, "ATTENTION — ARNAQUES COURRIERS", [
    "Le seul document papier à remplir et renvoyer, si vous le recevez, est le formulaire d'impôts 1447-C-K (CFE).",
    "Toute autre lettre, mail ou démarche payante (publicité, fausse CFE, amendes) est une arnaque.",
    "Devenir auto-entrepreneur est gratuit. Le rester sans activité l'est aussi.",
  ]);
  doc.moveDown(0.2);
  writeSubsectionTitle(doc, "Comment remplir le formulaire 1447-C-K");
  writeNumberedList(doc, [
    "Indiquer 0 salarié.",
    "Déclarer votre adresse de domicile (résidence personnelle).",
    "Cocher le régime micro-social / micro-entreprise.",
    "En principe, vous êtes exonéré de CFE la première année — le formulaire sert à le confirmer.",
    `En cas de doute, contactez ${RESPONSABLE.name} au ${RESPONSABLE.phone} avant d'envoyer quoi que ce soit.`,
  ]);
  doc.moveDown(0.4);
}

export function buildInpiGuidePdf(input: InpiGuideInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const dateLabel = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    writeCoverPage(doc, {
      subtitle: "Guide pas à pas — création micro-entreprise (auto-entrepreneur)",
      authorLine: `Rédigé par ${RESPONSABLE.name}, ${RESPONSABLE.role}`,
      contactLine: `Téléphone : ${RESPONSABLE.phone} — ${RESPONSABLE.email}`,
      personalizedFor: `Personnalisé pour ${input.firstName} ${input.lastName}`,
      dateLabel,
    });

    writeReassuranceSection(doc);
    drawHorizontalRule(doc);
    writeAlertBox(doc, "ATTENTION !", SCAM_ALERT_LINES);
    drawHorizontalRule(doc);
    writePlatformSection(doc);
    drawHorizontalRule(doc);
    writePersonalizedRecap(doc, input);
    drawHorizontalRule(doc);
    writeInpiWalkthrough(doc, input);
    doc.addPage();
    writeAlertBox(doc, "ATTENTION !", SCAM_ALERT_LINES);
    drawHorizontalRule(doc);
    writeAcreSection(doc);
    drawHorizontalRule(doc);
    writeInpiTipsSection(doc);
    drawHorizontalRule(doc);
    writeCfeSection(doc);

    ensureSpace(doc, 40);
    doc.moveDown(1);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#94A3B8")
      .text(
        "Document généré par Gadz'Connect — guide indicatif basé sur la tuyss Méthodo. Gadz'Connect ne crée pas l'entreprise à votre place. Vous restez responsable de votre déclaration sur procedures.inpi.fr.",
        { align: "center" },
      );

    doc.end();
  });
}
