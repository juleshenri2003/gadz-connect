/** Guide INPI — aligné sur la doc officielle INPI (vérifié juin 2026). */

export const INPI_URL = "https://procedures.inpi.fr/";
export const INPI_OFFICIAL_GUIDE_URL =
  "https://www.inpi.fr/realiser-demarches/formalites-dentreprises/creer-en-tant-que-micro-entrepreneur";
export const URSSAF_ACRE_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/demander-lacre.html";
export const URSSAF_PORTAL_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html";

export const INPI_GUIDE_META = {
  lastVerifiedAt: "2026-06-14",
  officialSource: INPI_OFFICIAL_GUIDE_URL,
  disclaimer:
    "Guide indicatif Gadz'Connect — le Guichet Unique INPI fait foi. En cas de doute, consultez procedures.inpi.fr ou contactez le responsable campus.",
} as const;

export const PLATFORM_CONTACTS = {
  responsable: {
    name: "Jules Henri",
    role: "Responsable Gadz'Connect",
    phone: "07 82 01 96 76",
    phoneHref: "tel:+33782019676",
    email: "jules.henri@ensam.eu",
    emailHref: "mailto:jules.henri@ensam.eu",
  },
} as const;

export const ACTIVITY_PATH_LABELS = [
  "Activités de services",
  "Enseignement",
  "Autres enseignements",
  "Soutien scolaire",
] as const;

export const ACTIVITY_PATH_COPY =
  "Activités de services → Enseignement → Autres enseignements → Soutien scolaire";

export const ID_CONFORMITY_MENTION =
  "Je certifie sur l'honneur que cette photocopie est conforme à l'original.";

export const REASSURANCE_POINTS = [
  {
    title: "Inscription 100 % gratuite",
    body: "Vous ne payez rien pour créer votre statut ni pour le conserver sans activité. Déclarer 0 € de chiffre d'affaires suffit si vous ne donnez pas encore de cours.",
  },
  {
    title: "Bourse inchangée",
    body: "Le statut d'auto-entrepreneur n'a pas d'incidence directe sur la bourse : elle reste calculée surtout sur les revenus de vos parents tant que vous êtes rattaché à leur foyer fiscal.",
  },
  {
    title: "Pas d'impact sur vos parents",
    body: "Vos revenus auto-entrepreneur sont les vôtres. Ils n'augmentent pas directement les revenus imposables de vos parents ni leur tranche d'imposition.",
  },
  {
    title: "APL — limite à 6 000 €",
    body: "Devenir auto-entrepreneur n'a pas d'impact sur l'imposition de vos parents, la vôtre, la bourse ni les APL tant que vos gains restent sous la limite de 6 000 € (à déclarer vous-même à l'URSSAF).",
  },
  {
    title: "Cotisations uniquement sur ce que vous gagnez",
    body: "Les cotisations URSSAF ne sont dues qu'à partir du moment où vous encaissez des virements. Taux indicatifs avec l'ACRE : 11 % la 1ʳᵉ année, 19 % la 2ᵉ, 22 % ensuite.",
  },
] as const;

export const SCAM_WARNINGS = [
  "Courriers postaux demandant de payer une CFE, un affichage publicitaire ou une « amende ».",
  "E-mails ou sites imitant l'URSSAF, l'INPI ou les impôts avec un lien de paiement.",
  "Toute démarche payante pour « finaliser » votre immatriculation — la création est gratuite ou à tarif réglementé très faible.",
] as const;

export const INPI_STEPS = [
  {
    id: "connect",
    title: "Se connecter au Guichet Unique",
    summary: "Ouvrir procedures.inpi.fr et créer ou utiliser votre compte.",
    details: [
      "Rendez-vous sur le portail e-procédures INPI (lien officiel ci-dessous).",
      "Créez un compte ou connectez-vous (FranceConnect possible).",
      "À la question **« Devenir compte administrateur de mon entreprise »**, répondez **NON** — sauf besoin très spécifique.",
      "Le « nom de dossier » est un libellé interne : il n'a aucun impact une fois l'inscription terminée.",
    ],
    link: INPI_URL,
    linkLabel: "Ouvrir procedures.inpi.fr",
  },
  {
    id: "begin",
    title: "Débuter la formalité de création",
    summary: "Lancer une création de micro-entreprise (entrepreneur individuel).",
    details: [
      "Cliquez sur **« Créer, modifier ou cesser une entreprise »** (rubrique Entreprises).",
      "Dans **« Création d'entreprise »**, cliquez sur **« Créer une entreprise »**.",
      "Lisez **« Préparez votre démarche »**, puis **« Continuer »**.",
      "À **« Quelle forme d'entreprise ? »** : choisissez **Entrepreneur individuel**.",
      "Cochez **Oui** à **« Souhaitez-vous opter pour le statut micro-entrepreneur ? »**.",
      "Donnez un nom à votre brouillon — vous pourrez le retrouver pendant 1 an via **« Accéder à mes brouillons »**.",
    ],
    tip: "Si vous avez déjà une EI et ajoutez une activité, c'est une modification, pas une création.",
  },
  {
    id: "identity",
    title: "Renseigner identité et établissement",
    summary: "Compléter toutes les rubriques obligatoires (astérisque *).",
    details: [
      "**Identité de l'entreprise** : vos informations personnelles, date de début d'activité, numéro de sécurité sociale.",
      "**Composition** et **Insaisissabilité** : en général rien à remplir pour un tutorat en solo — passez si facultatif.",
      "**Établissements** : adresse (souvent votre domicile), caractéristiques de l'établissement.",
      "Recopiez la **même adresse** dans le formulaire Gadz'Connect ci-dessous (factures URSSAF).",
      "Remplissez **tous les champs obligatoires** pour passer à l'étape suivante.",
      "En cas de doute sur une case, contactez le responsable Gadz'Connect avant de valider.",
    ],
  },
  {
    id: "activity",
    title: "Catégoriser l'activité (soutien scolaire)",
    summary: "Chemin exact dans l'arbre INPI pour donner des cours.",
    details: [
      "Dans **Établissements → Activité(s)**, suivez exactement ce chemin :",
    ],
    copyText: ACTIVITY_PATH_COPY,
    copyLabels: ACTIVITY_PATH_LABELS,
  },
  {
    id: "fiscal",
    title: "Options fiscales URSSAF & ACRE",
    summary: "Périodicité, versement libératoire ; ACRE souvent en NON sur l'INPI.",
    details: [
      "Rubrique **« Options fiscales »** : choisissez la **périodicité** (trimestrielle recommandée pour Gadz'Connect).",
      "Pour le **versement libératoire** : cochez selon votre choix au questionnaire Gadz'Connect.",
      "Si les démarches URSSAF ne sont pas encore faites, cochez **NON** au dépôt d'ACRE sur l'INPI.",
      "Vous pourrez demander l'ACRE ensuite sur le portail URSSAF (lien ci-dessous).",
    ],
    link: URSSAF_ACRE_URL,
    linkLabel: "Demander l'ACRE (URSSAF)",
    tip: "Un oubli de déclaration URSSAF peut entraîner une amende — activez l'app « AutoEntrepreneur URSSAF ».",
  },
  {
    id: "documents",
    title: "Pièces jointes obligatoires",
    summary: "CNI, domicile, non-condamnation — format PDF, 10 Mo max.",
    details: [
      "Téléversez les documents demandés au **format PDF** (10 Mo max par fichier).",
      "**Pièce d'identité** (CNI ou passeport) — voir encadré obligatoire ci-dessous.",
      "**Justificatif de domicile** : facture, quittance de loyer ou attestation hébergeur récente.",
      "**Déclaration sur l'honneur de non-condamnation** : formulaire à télécharger et signer.",
      "L'INPI ne valide pas la conformité des pièces — les autorités compétentes le font après envoi.",
    ],
    copyText: ID_CONFORMITY_MENTION,
    alert:
      "Sur la CNI : écrivez À LA MAIN sur le papier la mention de conformité, la date du jour et votre signature AVANT de scanner.",
    critical: true,
    tip: "Depuis août 2025, vous pouvez gérer l'anonymisation de vos données sur le Guichet Unique.",
  },
  {
    id: "validate",
    title: "Vérifier, signer et payer",
    summary: "Valider le dossier, signer, puis régler (souvent 0 € pour tutorat).",
    details: [
      "Rubrique **« Récapitulatif »** : vérifiez chaque section, puis **« Valider le dossier »**.",
      "Complétez **Correspondance** et **Observations** si demandé.",
      "Téléchargez la synthèse et vérifiez une dernière fois.",
      "Cochez **« Je confirme que les informations sont exactes »**, puis **« Signer la demande »**.",
      "**Attention** : après signature, plus de modification possible.",
      "Effectuez le **paiement** (carte bancaire) — les tarifs varient selon l'activité ; le soutien scolaire est souvent gratuit ou très faible.",
      "Conservez le reçu dans **Suivi des formalités → État d'avancement**.",
    ],
    alert:
      "« Valider le dossier » ne termine pas la démarche — signature et paiement sont obligatoires.",
  },
  {
    id: "followup",
    title: "Suivi INSEE et saisie SIRET",
    summary: "Attendre le SIRET (1 à 4 semaines), puis revenir sur Gadz'Connect.",
    details: [
      "Suivez votre dossier via **Suivi des formalités → État d'avancement des formalités**.",
      "En cas de dossier incomplet : régularisation sur le Guichet Unique (notification par e-mail).",
      "Une fois immatriculé : vous recevez votre **numéro SIRET** (14 chiffres).",
      "Revenez sur Gadz'Connect → **Micro-entreprise** pour déclarer votre SIRET.",
      "Pour télécharger la synthèse : préférez **Mozilla Firefox** (Safari pose parfois problème).",
    ],
    link: INPI_URL,
    linkLabel: "Suivi des formalités INPI",
  },
] as const;

export const CFE_GUIDE = {
  title: "Le seul courrier papier légitime : la CFE (formulaire 1447-C-K)",
  intro:
    "Après votre immatriculation, le seul document papier que vous pourriez recevoir et devoir renvoyer est le formulaire d'impôts **1447-C-K** relatif à la Cotisation Foncière des Entreprises (CFE). Tout autre courrier est suspect.",
  exempt:
    "En micro-entreprise et en début d'activité, vous êtes en principe **exonéré de CFE** la première année. Ce formulaire sert surtout à le confirmer.",
  fillSteps: [
    "Indiquer **0 salarié**.",
    "Déclarer votre **adresse de domicile** (résidence personnelle).",
    "Cocher le **régime micro-social** / micro-entreprise.",
    "Remplir le reste selon les cases du formulaire reçu — en cas de doute, contactez le responsable avant d'envoyer quoi que ce soit.",
  ],
  reminder:
    "Ne payez aucun chèque ni mandat joint à un courrier « CFE payante » ou « affichage obligatoire » : c'est une arnaque courante.",
} as const;
