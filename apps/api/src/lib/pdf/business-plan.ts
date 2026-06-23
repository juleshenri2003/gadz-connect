import PDFDocument from "pdfkit";
import {
  drawHorizontalRule,
  ensureSpace,
  writeAlertBox,
  writeBody,
  writeBulletList,
  writeNumberedList,
  writeSectionTitle,
  writeSubsectionTitle,
  writeTitle,
} from "./pdf-layout.js";

type PdfDoc = InstanceType<typeof PDFDocument>;

function writeCoverPage(doc: PdfDoc): void {
  doc.moveDown(2.5);
  writeTitle(doc, "Gadz'Connect");
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#4338CA")
    .text("Business plan PROVISOIRE", { align: "center" });
  doc.moveDown(1.2);
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#64748B")
    .text("Marketplace take-rate 15 % — campus gratuits", { align: "center" });
  doc.moveDown(2);
  writeAlertBox(doc, "DOCUMENT PROVISOIRE", [
    "Toutes les projections sont des hypothèses de travail à challenger avec des données réelles.",
    "Ne pas traiter comme un engagement.",
  ]);
  doc.moveDown(1);
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#475569")
    .text("15 juin 2026", { align: "center" });
  doc.addPage();
}

function writeResumeExecutif(doc: PdfDoc): void {
  writeSectionTitle(doc, "0. Résumé exécutif");
  writeBulletList(doc, [
    "Produit : plateforme inter-campus tutorat ENSAM + onboarding micro-entreprise + back-office RH.",
    "Business model : marketplace pure — gratuit pour les campus · 15 % de commission par heure de cours.",
    "Pari central : supprimer la douleur admin/fiscale des tuteurs ; se rémunérer uniquement quand un cours a lieu.",
    "Chiffres clés An 3 (base, hyp.) : ~216 k€ ARR · ~2 000 élèves · ~10 campus · valo 1,3–2,2 M€.",
  ]);
  doc.moveDown(0.4);
  writeBody(
    doc,
    "Écart code vs modèle : le code implémente une commission fixe (3–5 €/cours). Le modèle cible est 15 % du montant horaire — à aligner avant prod.",
  );
  doc.moveDown(0.8);
}

function writeProduitProbleme(doc: PdfDoc): void {
  writeSectionTitle(doc, "1. Produit et problème");

  writeSubsectionTitle(doc, "Douleurs par segment");
  writeBulletList(doc, [
    "Élèves — trouver un tuteur fiable même campus → marketplace, créneaux, répertoire.",
    "Tuteurs — micro-entreprise, SIRET, URSSAF → parcours express/complet, PDF INPI, Stripe Connect.",
    "RH campus — supervision opaque → cockpit /admin gratuit (utilisateurs, budgets, planning).",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Déjà en place (code)");
  writeBulletList(doc, [
    "Auth Magic Link · 4 rôles · 8 campus",
    "Onboarding micro-entreprise · auto-activation SIRET",
    "Marketplace · réservation · annulation/rebook",
    "Calcul fiscal · Stripe Connect · facturation PDF Configuration A",
    "Admin RH : dashboard, budgets, cours, planning",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Moat potentiel");
  writeBulletList(doc, [
    "Gratuit campus → adoption quasi nulle côté RH",
    "Vertical ENSAM → connaissance métier",
    "Compliance intégrée SIRET + URSSAF + Stripe",
    "Effet réseau local par campus",
  ]);
  doc.moveDown(0.8);
}

function writeMarche(doc: PdfDoc): void {
  writeSectionTitle(doc, "2. Marché (hypothèses)");

  writeSubsectionTitle(doc, "TAM / SAM / SOM");
  writeBulletList(doc, [
    "TAM : ~800 M€/an — tutorat encadré supérieur FR",
    "SAM : ~80 M€ GMV/an — grandes écoles peer-to-peer encadré",
    "SOM An 3 : ~216 k€ ARR — 10 campus, 36 000 h, 15 % × 1,44 M€ GMV",
  ]);
  doc.moveDown(0.3);
  writeBody(doc, "Aucune étude de marché primaire réalisée — ordres de grandeur.");
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Segments prioritaires");
  writeNumberedList(doc, [
    "Campus ENSAM pilote — 1 campus, 20 tuteurs",
    "8 campus ENSAM — déploiement réseau",
    "Autres grandes écoles — même modèle take-rate 15 %",
    "Secondaire : profs vacataires",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Concurrents");
  writeBulletList(doc, [
    "Superprof, Kelprof — Gadz : intra-campus, confiance école, gratuit établissement",
    "Excel + virement — Gadz : automatisation, traçabilité",
    "LMS — Gadz : complément focus tutorat + micro-ME",
  ]);
  doc.moveDown(0.8);
}

function writeBusinessModel(doc: PdfDoc): void {
  writeSectionTitle(doc, "3. Business model");

  writeSubsectionTitle(doc, "Marketplace take-rate 15 % — campus gratuits");
  writeBody(
    doc,
    "Gadz'Connect ne facture jamais les campus. Commission de 15 % prélevée sur chaque heure de cours au paiement élève (Stripe).",
  );
  doc.moveDown(0.3);
  writeNumberedList(doc, [
    "Adoption campus maximale — pas de procurement",
    "Alignement sur l'usage — revenus proportionnels au volume",
    "Comparable marché — Superprof 15–20 %",
    "Campus = canal de distribution, pas client payant",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Pricing (exemple 40 €/h)");
  writeBulletList(doc, [
    "Commission Gadz'Connect : 15 % = 6,00 €/h",
    "Part tuteur avant charges : 34,00 € → net ~26,84 € après URSSAF",
    "Coût campus : 0 €",
    "Coût élève : 40 € + 6 € = 46 € (selon UX)",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Gratuit vs commissionné");
  writeBody(doc, "Gratuit : inscription, marketplace, onboarding ME, cockpit RH, simulateur fiscal.");
  writeBody(doc, "Commission 15 % : chaque heure de cours payée via Stripe Connect.");
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Modèles écartés");
  writeBulletList(doc, [
    "Licence campus annuelle — freine l'adoption",
    "Commission fixe 5 € — ne scale pas avec les tarifs",
    "Freemium B2C élève — élève paie déjà le cours",
    "Abonnement tuteur — freine l'offre",
  ]);
  doc.moveDown(0.8);
}

function writeUnitEconomics(doc: PdfDoc): void {
  writeSectionTitle(doc, "4. Unit economics");

  writeSubsectionTitle(doc, "Coûts variables / heure (40 €/h)");
  writeBulletList(doc, [
    "Revenu commission 15 % : +6,00 €",
    "Stripe (GMV ~46 €) : −0,89 €",
    "Infra (Supabase + Cloud Run) : −0,05 €",
    "Marge brute / h (Stripe absorbé) : ~5,06 € (84 %)",
    "Marge brute / h (Stripe refacturé) : ~5,95 € (99 %)",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Sensibilité tarif horaire (15 %)");
  writeBulletList(doc, [
    "30 €/h → commission 4,50 € (−10 % vs 5 € fixe)",
    "40 €/h → commission 6,00 € (+20 %)",
    "50 €/h → commission 7,50 € (+50 %)",
    "60 €/h → commission 9,00 € (+80 %)",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Métriques clés (hyp. An 2–3)");
  writeBulletList(doc, [
    "Revenu / heure moyenne : 6,00 €",
    "GMV / campus actif / an : 144 000 € (3 600 h)",
    "Revenu / campus / an : ~21 600 €",
    "CAC campus : ~500 € · LTV campus 3 ans : ~52 000 € · LTV/CAC : ~100×",
    "Heures / élève / mois : 2 h (hyp.)",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Seuil de rentabilité");
  writeBulletList(doc, [
    "Coûts fixes An 1 : ~80 k€ · An 3 : ~180 k€",
    "Marge / heure : ~5,50 €",
    "Heures nécessaires / an : ~14 500 h (An 1) · ~33 000 h (An 3)",
    "An 1 base : 2 700 h → déficit · An 3 base : 36 000 h → proche breakeven",
  ]);
  doc.moveDown(0.8);
}

function writePrevisions(doc: PdfDoc): void {
  writeSectionTitle(doc, "5. Prévisions financières");

  writeSubsectionTitle(doc, "Hypothèses communes");
  writeBulletList(doc, [
    "9 mois actifs (sept–mai) · tarif moyen 40 €/h · commission 15 % = 6 €/h",
    "Aucune licence campus",
    "Coûts fixes : ~80 k€ An 1 · ~120 k€ An 2 · ~180 k€ An 3",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Scénario base — jalons");
  writeBulletList(doc, [
    "An 1 : 1 campus · 20 tuteurs · 150 élèves · 2 700 h · 16 k€ rev. · −64 k€",
    "An 2 : 3 campus · 55 tuteurs · 450 élèves · 8 100 h · 49 k€ rev. · −71 k€",
    "An 3 : 10 campus · 150 tuteurs · 2 000 élèves · 36 000 h · 216 k€ rev. · +36 k€",
    "An 5 : 25 campus · 400 tuteurs · 6 000 élèves · 108 000 h · 648 k€ rev. · +328 k€",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Scénario optimiste An 3");
  writeBody(
    doc,
    "15 campus · 280 tuteurs · 4 000 élèves · 72 000 h · 432 k€ rev. · +232 k€ · cash cumulé +133 k€",
  );
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Scénario pessimiste An 3");
  writeBody(
    doc,
    "2 campus · 25 tuteurs · 200 élèves · 1 800 h · 11 k€ rev. · −129 k€ · cash cumulé −320 k€",
  );
  doc.moveDown(0.8);
}

function writeValorisation(doc: PdfDoc): void {
  writeSectionTitle(doc, "6. Valorisation estimée (hypothèses)");

  writeBulletList(doc, [
    "An 3 base : 216 k€ rev. × 6–10× → 1,3–2,2 M€",
    "An 3 optimiste : 432 k€ rev. × 8–12× → 3,5–5,2 M€",
    "An 5 base : 648 k€ rev. × 5–8× → 3,2–5,2 M€",
    "An 5 optimiste : 1 296 k€ rev. × 8–12× → 10–16 M€",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Facteurs ↑ valuation");
  writeBody(
    doc,
    "GMV > 80 %/an · 10+ campus actifs · marge > 80 % · expansion hors ENSAM · rétention solide · commission alignée code.",
  );
  doc.moveDown(0.3);
  writeSubsectionTitle(doc, "Facteurs ↓ valuation");
  writeBody(
    doc,
    "Volume insuffisant An 1–2 · checkout non finalisé · contournement informel · dépendance 1–2 campus · code désaligné.",
  );
  doc.moveDown(0.8);
}

function writeRoadmap(doc: PdfDoc): void {
  writeSectionTitle(doc, "7. Roadmap business");
  writeBulletList(doc, [
    "Phase 1 — PMF campus (An 1) : 20 tuteurs · 150 élèves · 2 700 h · checkout live · 15 % codé",
    "Phase 2 — Réseau ENSAM (An 2–3) : 10 campus · 36 000 h · 216 k€ · breakeven",
    "Phase 3 — Multi-écoles (An 4–5) : 25 campus · 648 k€ · planning iCal · URSSAF auto",
    "Phase 4 — Plateforme (An 5+) : 40+ campus · 1 M€+ rev. · vacataires",
  ]);
  doc.moveDown(0.8);
}

function writeExits(doc: PdfDoc): void {
  writeSectionTitle(doc, "8. Scénarios de sortie");
  writeBulletList(doc, [
    "Acquisition edtech (An 4–5) : 3–8 M€ — prob. moyenne",
    "Acquisition ENSAM (An 3–4) : 1–3 M€ — prob. faible-moyenne",
    "Levée + scale (An 2–3) : seed 300–600 k€ — dilution 15–25 %",
    "Lifestyle / rentabilité (An 3+) : 30–80 k€/an — prob. élevée",
    "Échec / pivot (An 1–2) : ~0 — < 10 tuteurs M+6",
  ]);
  doc.moveDown(0.8);
}

function writeRisques(doc: PdfDoc): void {
  writeSectionTitle(doc, "9. Risques et hypothèses critiques");
  writeBulletList(doc, [
    "Volume insuffisant — prob. élevée — densifier 1 campus",
    "Contournement plateforme — prob. moyenne — valeur admin + paiement sécurisé",
    "Checkout Stripe retardé — prob. élevée — priorité technique",
    "Commission 15 % mal acceptée — benchmark Superprof",
    "Saisonnalité été — trésorerie 12 mois",
    "Dépendance 1 campus — sponsor RH + campus 2 dès An 2",
    "Code fiscal désaligné — migrer fiscal.ts avant prod",
  ]);
  doc.moveDown(0.4);

  writeSubsectionTitle(doc, "Hypothèses qui cassent le modèle");
  writeNumberedList(doc, [
    "2 h/élève/mois en moyenne",
    "Tuteurs acceptent 15 % vs cash informel",
    "Campus déploient l'outil (effort RH non nul)",
    "Checkout Stripe live avant fin An 1",
  ]);
  doc.moveDown(0.8);
}

function writeProchainesEtapes(doc: PdfDoc): void {
  writeSectionTitle(doc, "10. Prochaines étapes (90 jours)");
  writeNumberedList(doc, [
    "Migrer commission → 15 % dans fiscal.ts + Stripe",
    "Finaliser checkout Stripe élève — 1ère transaction succeeded",
    "Pilote campus sponsor RH — 20 tuteurs · 100+ h réservées",
    "Mesurer heures/élève/mois réelles — dashboard GMV 90 j",
    "Déployer CI/CD Cloud Run — API prod + monitoring",
  ]);
  doc.moveDown(1);

  ensureSpace(doc, 40);
  drawHorizontalRule(doc);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94A3B8")
    .text(
      "Gadz'Connect — Business plan PROVISOIRE — 15 juin 2026. Modèle : campus gratuits, commission 15 %/h. Hypothèses non engageantes.",
      { align: "center" },
    );
}

export function buildBusinessPlanPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeCoverPage(doc);
    writeResumeExecutif(doc);
    writeProduitProbleme(doc);
    writeMarche(doc);
    writeBusinessModel(doc);
    writeUnitEconomics(doc);
    writePrevisions(doc);
    writeValorisation(doc);
    writeRoadmap(doc);
    writeExits(doc);
    writeRisques(doc);
    writeProchainesEtapes(doc);

    doc.end();
  });
}
