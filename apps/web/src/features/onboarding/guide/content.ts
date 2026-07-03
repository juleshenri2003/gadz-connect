/** Guide INPI — vérifié sur guichet-unique.inpi.fr (juillet 2026). */

export const INPI_URL = "https://guichet-unique.inpi.fr/";
export const INPI_OFFICIAL_GUIDE_URL =
  "https://www.inpi.fr/realiser-demarches/formalites-dentreprises/creer-en-tant-que-micro-entrepreneur";
export const URSSAF_ACRE_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/demander-lacre.html";
export const URSSAF_PORTAL_URL =
  "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html";

export const INPI_GUIDE_META = {
  lastVerifiedAt: "2026-07-03",
  officialSource: INPI_OFFICIAL_GUIDE_URL,
  disclaimer:
    "Guide indicatif Gadz'Connect — le Guichet Unique INPI fait foi. En cas de doute, consultez guichet-unique.inpi.fr ou contactez le responsable campus.",
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
    summary: "Ouvrir guichet-unique.inpi.fr et créer ou utiliser votre compte.",
    details: [
      "Rendez-vous sur le Guichet Unique INPI (lien ci-dessous). L'ancienne URL procedures.inpi.fr redirige vers le même portail.",
      "Créez un compte ou connectez-vous (FranceConnect possible).",
      "À la question **« Devenir compte administrateur de mon entreprise »**, répondez **NON** — sauf besoin très spécifique.",
    ],
    link: INPI_URL,
    linkLabel: "Ouvrir le Guichet Unique INPI",
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
      "Le brouillon est conservé 1 an via **« Accéder à mes brouillons »**.",
    ],
    tip: "Si vous avez déjà une EI et ajoutez une activité, c'est une modification, pas une création.",
  },
  {
    id: "identity",
    title: "Identité de l'entreprise",
    summary:
      "Trois sous-sections : Entrepreneur, Entreprise, Contrat d'appui — périodicité et ACRE se renseignent ici.",
    details: [
      "**Entrepreneur** — identité : nom de naissance, genre, date et lieu de naissance, nationalité, situation matrimoniale. Statut ambulant : **Non**.",
      "**Régime microsocial** : choisissez la **périodicité** (trimestrielle recommandée pour Gadz'Connect — pas « Mensuel » par défaut).",
      "**Adresse de l'entrepreneur** et **Contact** : domicile, pays, téléphone * et e-mail.",
      "**Volet social** : n° de sécurité sociale (15 caractères). Activité non salariée antérieure : **Non** (1ʳᵉ création) ou **Oui** si déjà auto-entrepreneur. Organisme d'assurance maladie : votre caisse (souvent CPAM).",
      "**« Avez-vous déjà formulé une demande d'ACRE auprès de l'Urssaf ? »** : **Non** si pas encore fait — demandez l'ACRE ensuite sur le portail URSSAF.",
      "Exercice d'une activité simultanée : **Non** (1ʳᵉ AE) ou **Oui** si vous avez déjà une micro-entreprise. Affiliation biologiste : **Non**.",
      "**Entreprise** — **Nom du brouillon** * (ex. prénom ou « GadzConnect-Tutorat »).",
      "**Adresse de l'entreprise** : domiciliation à votre domicile. Cochez la case **« J'ai pris connaissance des conséquences… »** (adresse publiée au RNE). Société de domiciliation : **Non**.",
      "Recopiez la **même adresse** dans le formulaire Gadz'Connect ci-dessous (factures URSSAF).",
      "**Contrat d'appui** : **« Un contrat d'appui a-t-il été conclu ? »** → **Non** (dispositif RSA/chômage, pas le tutorat étudiant).",
    ],
    link: URSSAF_ACRE_URL,
    linkLabel: "Demander l'ACRE (URSSAF)",
  },
  {
    id: "composition",
    title: "Composition et insaisissabilité",
    summary: "En solo : ne pas ajouter de représentant ; répondre Non à l'insaisissabilité notariée.",
    details: [
      "**Composition** : ne cliquez pas sur **« Ajouter un représentant »** — « Aucun pouvoir n'est défini » est normal pour un tuteur seul.",
      "**Insaisissabilité — Résidence principale** : **« Avez-vous effectué une déclaration devant notaire ? »** → **Non** (protection par défaut).",
      "**Autres résidences** : ne rien ajouter si vous n'avez pas de résidence secondaire.",
    ],
  },
  {
    id: "establishments",
    title: "Établissements et activité",
    summary: "Établissement principal, puis ajouter l'activité soutien scolaire.",
    details: [
      "**Informations générales** : établissement principal → **Oui**. Nom commercial : facultatif.",
      "**Activités** : cliquez **« Ajouter une activité »**, puis remplissez :",
      "Activité principale → **Oui**. **Date de début d'activité** * (souvent le jour de la création ou votre 1er cours).",
      "Exercice → **Permanente**. Ambulant → **Non**. **Description détaillée** * (ex. cours particuliers / soutien scolaire).",
      "Dans les menus **Catégorisation 1, 2, 3…**, suivez exactement ce chemin :",
    ],
    copyText: ACTIVITY_PATH_COPY,
    copyLabels: ACTIVITY_PATH_LABELS,
    tip: "Section **Origine** : type d'origine → **Création**. **Nom de domaine internet** : facultatif — laisser vide sans site web.",
  },
  {
    id: "fiscal",
    title: "Options fiscales",
    summary: "Versement libératoire uniquement — la périodicité et l'ACRE sont à l'étape Identité.",
    details: [
      "Rubrique **« Options fiscales »** : seule question — **« Option pour le versement libératoire ? »**",
      "Répondez selon votre choix au **questionnaire Gadz'Connect** (Oui ou Non).",
      "La **périodicité URSSAF** se choisit à l'étape **Identité → Entrepreneur → Régime microsocial**.",
      "L'**ACRE** se déclare à l'étape **Identité → Volet social** (puis sur URSSAF si besoin).",
    ],
    tip: "Un oubli de déclaration URSSAF peut entraîner une amende — activez l'app « AutoEntrepreneur URSSAF ».",
  },
  {
    id: "documents",
    title: "Pièces jointes",
    summary: "PDF 10 Mo max — choisir le type de pièce, ignorer mandataire si vous déclarez pour vous-même.",
    details: [
      "Téléversez au **format PDF** (10 Mo max par fichier).",
      "**Identité de l'entreprise** : sélectionnez le **type de pièce** (CNI ou passeport), puis joignez le scan — voir encadré CNI ci-dessous.",
      "**Justificatif de domicile** et **déclaration de non-condamnation** : si demandés selon votre dossier, joignez-les au même format.",
      "**Représentant ou mandataire** : ignorez cette section si vous déclarez **pour vous-même** (pas de procuration).",
      "**Insaisissabilité** : attestation notariée uniquement si vous avez répondu **Oui** à la déclaration notariée.",
      "**Pièces supplémentaires** : facultatif — n'ajoutez rien sauf besoin spécifique.",
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
    title: "Observations, correspondance et validation",
    summary: "Prospection → Non, puis récapitulatif, signature et paiement.",
    details: [
      "**Observations et correspondance** : commentaire facultatif.",
      "**Prospection commerciale** * : **Non** — « Je consens à la mise à disposition de mes données à des fins de prospection ».",
      "Confidentialité Sirène : case facultative selon votre choix.",
      "**Correspondance** : type de destinataire → **Entrepreneur**. Pays, e-mail et téléphone.",
      "**Récapitulatif** : vérifiez chaque section repliable, puis **« VALIDER LE DOSSIER »**.",
      "Si vos coordonnées déclarant sont incorrectes, modifiez-les dans votre compte e-procédures INPI.",
      "Téléchargez la synthèse, cochez **« Je confirme que les informations sont exactes »**, puis **« Signer la demande »**.",
      "**Attention** : après signature, plus de modification possible.",
      "Effectuez le **paiement** (carte bancaire) — tarif réglementé, souvent gratuit ou très faible pour le soutien scolaire.",
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
