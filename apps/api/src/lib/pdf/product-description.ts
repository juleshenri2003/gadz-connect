import PDFDocument from "pdfkit";
import {
  drawHorizontalRule,
  ensureSpace,
  writeBody,
  writeBulletList,
  writeNumberedList,
  writeSectionTitle,
  writeSubsectionTitle,
  writeTitle,
} from "./pdf-layout.js";

type PdfDoc = InstanceType<typeof PDFDocument>;

function writeCoverPage(doc: PdfDoc): void {
  doc.moveDown(3);
  writeTitle(doc, "Gadz'Connect");
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#4338CA")
    .text("Description complète du produit", { align: "center" });
  doc.moveDown(1.5);
  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#64748B")
    .text("Plateforme inter-campus Arts et Métiers", { align: "center" });
  doc.text("Tutorat · Micro-entreprise · Paiement · Facturation", {
    align: "center",
  });
  doc.moveDown(2.5);
  drawHorizontalRule(doc);
  doc
    .font("Helvetica")
    .fontSize(BODY_SIZE)
    .fillColor("#475569")
    .text(
      "Document de présentation — à partager pour comprendre le fonctionnement de la plateforme.",
      { align: "center" },
    );
  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.moveDown(1);
  doc.text(dateLabel, { align: "center" });
  doc.addPage();
}

const BODY_SIZE = 10.5;

function writeEnUnePhrase(doc: PdfDoc): void {
  writeSectionTitle(doc, "En une phrase");
  writeBody(
    doc,
    "Gadz'Connect est la plateforme des Arts et Métiers qui permet à des étudiants de donner des cours particuliers à d'autres étudiants du même campus, en étant auto-entrepreneurs, avec paiement en ligne, gestion fiscale et facturation automatique.",
  );
  doc.moveDown(0.4);
  writeBody(
    doc,
    "La plateforme est portée par une SASU qui encaisse l'argent, prend une petite commission, et reverse le reste au tuteur via Stripe.",
  );
  doc.moveDown(0.8);
}

function writeProbleme(doc: PdfDoc): void {
  writeSectionTitle(doc, "Le problème que ça résout");
  writeBody(
    doc,
    "Sur le campus, beaucoup d'étudiants veulent donner des cours (SolidWorks, maths, physique, etc.) mais la paperasse les bloque :",
  );
  doc.moveDown(0.3);
  writeBulletList(doc, [
    "Créer une micro-entreprise (INPI, URSSAF, SIRET…)",
    "Comprendre les cotisations et déclarations",
    "Encaisser l'argent légalement",
    "Émettre des factures conformes",
  ]);
  doc.moveDown(0.3);
  writeBody(
    doc,
    "En parallèle, les élèves qui cherchent de l'aide n'ont pas de place fiable pour trouver un tuteur du campus, voir son CV, réserver un créneau et payer. Gadz'Connect centralise tout cela dans une seule application web.",
  );
  doc.moveDown(0.8);
}

function writeActeurs(doc: PdfDoc): void {
  writeSectionTitle(doc, "Les acteurs (4 rôles)");
  const roles = [
    "Élève (student_provider) — Étudiant qui reçoit des cours : cherche un tuteur, réserve, paie, consulte son planning et son répertoire.",
    "Prof / tuteur (teacher) — Étudiant auto-entrepreneur qui donne des cours : onboarding micro-entreprise, créneaux, paiements, compta URSSAF.",
    "Admin campus — Responsable d'un campus : supervise les membres et cours de son campus.",
    "Admin RH / pilotage (admin_general) — Équipe Gadz'Connect : vue globale budgets, utilisateurs, alertes, factures.",
  ];
  writeBulletList(doc, roles);
  doc.moveDown(0.3);
  writeBody(
    doc,
    "Chaque utilisateur est rattaché à un campus (Paris, Lille, Bordeaux, etc.) — la marketplace ne mélange pas les campus.",
  );
  doc.moveDown(0.8);
}

function writeParcours(doc: PdfDoc): void {
  writeSectionTitle(doc, "Parcours complet, de A à Z");

  writeSubsectionTitle(doc, "1. Connexion");
  writeBulletList(doc, [
    "Connexion avec mail @ensam.eu (magic link)",
    "Choix du campus",
    "Complétion du profil à la première connexion",
  ]);
  doc.moveDown(0.5);

  writeSubsectionTitle(doc, "2. Devenir tuteur (professeur)");
  writeBody(doc, "Un étudiant qui veut donner des cours choisit le rôle intervenant et suit :");
  doc.moveDown(0.2);
  writeNumberedList(doc, [
    "Profil — CV PDF ou texte visible par les élèves",
    "Micro-entreprise — questionnaire fiscal, parcours express (SIRET existant) ou complet (création via INPI)",
    "Stripe Connect — connexion du compte bancaire pour recevoir les virements",
    "Publication de créneaux — tarif horaire, matières, disponibilités",
  ]);
  doc.moveDown(0.3);
  writeBody(
    doc,
    "Pour apparaître dans « Trouver mon tuteur » : compte actif, SIRET valide, auto-entrepreneur vérifié, Stripe configuré, créneaux à venir, profil complet.",
  );
  doc.moveDown(0.5);

  writeSubsectionTitle(doc, "3. Réserver un cours (côté élève)");
  writeNumberedList(doc, [
    "Aller sur « Trouver mon tuteur »",
    "Filtrer par matière, consulter profils (bio, CV, tarif)",
    "Choisir un créneau (ex. mardi 14h–15h)",
    "Réserver → cours créé en attente de paiement",
    "Payer par carte (Stripe) — ex. 36 € pour 1h à 36 €/h",
    "Après paiement : créneau bloqué, cours planifié, factures générées, notification au tuteur",
  ]);
  doc.moveDown(0.5);

  writeSubsectionTitle(doc, "4. Le jour du cours");
  writeBulletList(doc, [
    "Cours visible dans le planning des deux parties",
    "Après la séance : cours marqué terminé",
    "En cas d'annulation : créneau libéré, l'élève peut réserver ailleurs",
  ]);
  doc.moveDown(0.5);

  writeSubsectionTitle(doc, "5. Côté argent (tuteur)");
  writeBody(
    doc,
    "Sur Paiements (/app/paiements) : encaissements brut/net, transactions, factures URSSAF (PDF), montants à déclarer.",
  );
  doc.moveDown(0.8);
}

function writeModeleEconomique(doc: PdfDoc): void {
  writeSectionTitle(doc, "Modèle économique — Configuration A (SAP)");
  writeBody(
    doc,
    "L'élève paie (ex. 36 €) → Gadz'Connect encaisse via Stripe → commission plateforme 3 € → part tuteur 33 € (virement Stripe Connect). Les cotisations URSSAF sont déduites côté tuteur pour obtenir le net réel.",
  );
  doc.moveDown(0.5);

  writeSubsectionTitle(doc, "Deux factures PDF par paiement");
  writeBulletList(doc, [
    "Facture parent — Émise par Gadz'Connect (n° SAP) → élève qui a payé — 36 €",
    "Facture étudiant — Émise par l'auto-entreprise du tuteur → Gadz'Connect — 33 €",
  ]);
  doc.moveDown(0.3);
  writeBody(
    doc,
    "La facture parent est envoyée par e-mail. La facture étudiant est stockée dans l'app pour la compta URSSAF. Mentions légales : Services à la Personne, TVA, art. 293 B du CGI.",
  );
  doc.moveDown(0.8);
}

function writeExempleChiffre(doc: PdfDoc): void {
  writeSectionTitle(doc, "Exemple chiffré (cours à 36 €, sans ACRE)");
  writeBulletList(doc, [
    "Montant payé par l'élève : 36,00 €",
    "Commission Gadz'Connect (SASU) : − 3,00 €",
    "Base après commission : 33,00 €",
    "Cotisations URSSAF (21,1 %) : − 6,96 €",
    "Net versé au tuteur : ≈ 26,04 €",
  ]);
  doc.moveDown(0.3);
  writeBody(
    doc,
    "Avec ACRE (1ère année) : taux URSSAF à 10,6 % → net plus élevé.",
  );
  doc.moveDown(0.8);
}

function writePilotage(doc: PdfDoc): void {
  writeSectionTitle(doc, "Interface de pilotage RH (/admin)");
  writeBody(
    doc,
    "Réservée à l'équipe Gadz'Connect. Tableau de bord opérationnel inter-campus :",
  );
  doc.moveDown(0.3);
  writeBulletList(doc, [
    "Tableau de bord — vue d'ensemble, tâches urgentes (SIRET, doublons…)",
    "Planning — emploi du temps multi-campus",
    "Alertes — notifications campus",
    "Utilisateurs — profils, statuts, suspensions",
    "Budgets — transactions, commissions, aperçu factures PDF",
    "Cours — supervision des séances",
  ]);
  doc.moveDown(0.8);
}

function writeFonctionnalites(doc: PdfDoc): void {
  writeSectionTitle(doc, "Fonctionnalités par zone");

  writeSubsectionTitle(doc, "Espace élève (/app)");
  writeBulletList(doc, [
    "Tableau de bord, planning, alertes",
    "Trouver mon tuteur (marketplace)",
    "Mon répertoire (dossiers par matière, comptes-rendus)",
    "Mon profil",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Espace tuteur (/app)");
  writeBulletList(doc, [
    "Tout l'espace élève, plus :",
    "Micro-entreprise (onboarding SIRET)",
    "Paiements (Stripe, transactions, factures URSSAF)",
    "Mes cours (créneaux, visibilité marketplace)",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Espace RH (/admin)");
  writeBody(doc, "Pilotage inter-campus décrit ci-dessus.");
  doc.moveDown(0.8);
}

function writeFluxPaiement(doc: PdfDoc): void {
  writeSectionTitle(doc, "Flux de paiement (résumé)");
  writeNumberedList(doc, [
    "L'élève réserve un créneau sur la marketplace",
    "Gadz'Connect crée un PaymentIntent Stripe",
    "L'élève paie par carte",
    "Webhook Stripe confirme le paiement",
    "Génération des 2 factures PDF",
    "E-mail facture parent + stockage facture tuteur",
    "Virement Stripe Connect vers le tuteur",
    "Notification in-app au tuteur",
  ]);
  doc.moveDown(0.8);
}

function writeStack(doc: PdfDoc): void {
  writeSectionTitle(doc, "Stack technique");
  writeBulletList(doc, [
    "Frontend : React + Vite + TypeScript",
    "Backend : Node.js + Express",
    "Base de données : Supabase (PostgreSQL)",
    "Auth : Supabase Magic Link",
    "Paiements : Stripe Connect (comptes Express)",
    "PDF : pdfkit — E-mails : Resend",
    "Hébergement cible : Google Cloud Run",
    "Monorepo pnpm : apps/web, apps/api, packages/types, packages/ui",
  ]);
  doc.moveDown(0.8);
}

function writeEtat(doc: PdfDoc): void {
  writeSectionTitle(doc, "Où en est le produit ?");

  writeSubsectionTitle(doc, "Déjà en place");
  writeBulletList(doc, [
    "Auth, profils, campus",
    "Onboarding micro-entreprise (questionnaire, guide INPI, SIRET)",
    "Marketplace (recherche, CV, créneaux, réservation)",
    "Paiement Stripe à la réservation",
    "Calcul fiscal automatique (commission, URSSAF, net)",
    "Facturation PDF Configuration A + aperçu pilotage",
    "Notifications in-app, dashboard tuteur, pilotage RH",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "En cours / à venir");
  writeBulletList(doc, [
    "Migration facturation en production",
    "Envoi e-mail factures (Resend)",
    "Saisie adresse auto-entreprise dans l'UI",
    "Synchronisation planning ADE (iCal)",
    "Déclarations URSSAF automatisées",
    "Extension aux 8 campus",
  ]);
  doc.moveDown(0.8);
}

function writeAnalogie(doc: PdfDoc): void {
  writeSectionTitle(doc, "Analogie simple");
  writeBody(
    doc,
    "C'est comme Uber ou Doctolib, mais pour le tutorat entre étudiants Arts et Métiers. Le tuteur est auto-entrepreneur, l'élève paie sur la plateforme, et Gadz'Connect s'occupe de la paperasse : SIRET, factures, virements, et un tableau de bord pour que l'équipe RH pilote tout.",
  );
  doc.moveDown(0.8);
}

function writeUrls(doc: PdfDoc): void {
  writeSectionTitle(doc, "URLs utiles (développement local)");
  writeBulletList(doc, [
    "Connexion élève/prof : http://localhost:5173",
    "Connexion RH : http://localhost:5173/rh/login",
    "App prof/élève : http://localhost:5173/app",
    "Pilotage RH : http://localhost:5173/admin",
    "Budgets + factures : http://localhost:5173/admin/budgets",
  ]);
  doc.moveDown(1);

  ensureSpace(doc, 40);
  drawHorizontalRule(doc);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94A3B8")
    .text(
      "Document généré par Gadz'Connect — juin 2026. Structure juridique : SASU Gadz'Connect — Code APE 85.59W.",
      { align: "center" },
    );
}

export function buildProductDescriptionPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeCoverPage(doc);
    writeEnUnePhrase(doc);
    writeProbleme(doc);
    writeActeurs(doc);
    writeParcours(doc);
    writeModeleEconomique(doc);
    writeExempleChiffre(doc);
    writePilotage(doc);
    writeFonctionnalites(doc);
    writeFluxPaiement(doc);
    writeStack(doc);
    writeEtat(doc);
    writeAnalogie(doc);
    writeUrls(doc);

    doc.end();
  });
}
