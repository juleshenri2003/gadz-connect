/** Contenu issu du guide « TUYSS FINALE — Devenir Auto-entrepreneur Pour Méthodo » */

export const INPI_URL = "https://procedures.inpi.fr/";
export const URSSAF_ACRE_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/demander-lacre.html";
export const URSSAF_PORTAL_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html";

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
  "Toute démarche payante pour « finaliser » votre immatriculation — tout est gratuit.",
] as const;

export const INPI_STEPS = [
  {
    id: "access",
    title: "Accéder au Guichet Unique INPI",
    summary: "Ouvrir le site officiel et lancer une création de micro-entreprise.",
    details: [
      "Rendez-vous sur le Guichet Unique INPI (lien officiel ci-dessous).",
      "Lancez une demande de **création d'une micro-entreprise**.",
      "Choisissez la **démarche encadrée** (cadre rouge sur le site).",
      "Acceptez les conditions, puis sélectionnez **« Création d'entreprise »**.",
    ],
    link: INPI_URL,
    linkLabel: "Ouvrir procedures.inpi.fr",
  },
  {
    id: "franceconnect",
    title: "Connexion FranceConnect",
    summary: "Reconnectez-vous avec FranceConnect si demandé.",
    details: [
      "Utilisez **FranceConnect** si le site vous y invite (compte existant ou création).",
      "À la question **« Devenir compte administrateur de mon entreprise »**, répondez **NON**.",
      "Le « nom de dossier » est un libellé interne : il n'a aucun impact une fois l'inscription terminée.",
      "En cas de doute sur une case, contactez le responsable Gadz'Connect.",
    ],
    alert:
      "Réponse obligatoire : NON à « compte administrateur » — sauf besoin spécifique que personne n'a ici.",
  },
  {
    id: "activity",
    title: "Catégoriser votre activité (soutien scolaire)",
    summary: "Chemin exact dans l'arbre INPI pour donner des cours.",
    details: [
      "Dans la catégorisation de l'activité, suivez exactement ce chemin :",
    ],
    copyText: ACTIVITY_PATH_COPY,
    copyLabels: ACTIVITY_PATH_LABELS,
  },
  {
    id: "urssaf",
    title: "Périodicité URSSAF & ACRE",
    summary: "Déclarations trimestrielles recommandées ; ACRE en parallèle si besoin.",
    details: [
      "Pour la **périodicité des déclarations**, choisissez **Trimestrielle** (recommandé plutôt que mensuelle).",
      "Un oubli de déclaration peut entraîner une amende URSSAF — pensez à l'app « AutoEntrepreneur URSSAF ».",
      "Si les démarches URSSAF ne sont pas encore faites au moment de la création, cochez **NON** au dépôt d'ACRE sur l'INPI.",
      "Vous pourrez demander l'ACRE ensuite sur le portail URSSAF (lien ci-dessous).",
    ],
    link: URSSAF_ACRE_URL,
    linkLabel: "Demander l'ACRE (URSSAF)",
    tip: "Conseil guide Méthodo : trimestrielle, pas mensuelle.",
  },
  {
    id: "identity",
    title: "Pièce d'identité — étape critique",
    summary: "Scanner une CNI ou passeport avec mention manuscrite obligatoire.",
    details: [
      "Préparez une photocopie ou scan de votre pièce d'identité (CNI ou passeport).",
      "**Avant de scanner**, écrivez à la main sur le papier :",
      "1. La mention de conformité (texte ci-dessous à recopier).",
      "2. La date du jour.",
      "3. Votre signature.",
      "Seulement ensuite, scannez ou photographiez le document et téléversez-le.",
    ],
    copyText: ID_CONFORMITY_MENTION,
    alert:
      "Sans mention manuscrite + date + signature sur le papier, votre dossier peut être refusé.",
    critical: true,
  },
  {
    id: "submit",
    title: "Envoi du dossier & attente SIRET",
    summary: "Valider, envoyer, puis récupérer votre numéro SIRET sous 1 à 4 semaines.",
    details: [
      "Vérifiez le récapitulatif, puis **envoyez le dossier**.",
      "Créez votre compte URSSAF si ce n'est pas déjà fait.",
      "Téléchargez le document ACRE si vous ne l'avez pas demandé à la création.",
      "Vous recevrez votre **numéro SIRET** après validation INSEE — revenez sur Gadz'Connect pour le saisir.",
      "Pour récupérer la synthèse de création sur l'INPI : préférez **Mozilla Firefox** (Safari sur Mac pose souvent problème).",
    ],
    link: INPI_URL,
    linkLabel: "Retour sur l'espace INPI",
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
