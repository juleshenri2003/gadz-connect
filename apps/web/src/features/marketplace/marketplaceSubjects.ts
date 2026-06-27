/**
 * Matières proposées sur la page d'accueil — lycée général, prépa et filières
 * scientifiques / techniques (pas design, commerce, etc.).
 */
export const MARKETPLACE_SUBJECT_CATALOG = [
  // Lycée général — sciences
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "NSI",
  "Sciences de l'ingénieur",
  // Lycée général — tronc commun
  "Français",
  "Philosophie",
  "Histoire-Géographie",
  "Anglais",
  "Espagnol",
  "Allemand",
  "SES",
  // Prépa scientifique
  "Maths sup / spé",
  "Physique prépa",
  "Chimie prépa",
  "SI prépa",
  "Informatique prépa",
  // Filières techniques (sciences)
  "STI2D",
  "STL",
  "Mécanique",
  "Électricité",
  "Électronique",
  "Informatique",
  "Robotique",
  "CAO / DAO",
  "Résistance des matériaux",
  // Outils / compétences scientifiques
  "Python",
  "Algorithmique",
] as const;

export type MarketplaceCatalogSubject =
  (typeof MARKETPLACE_SUBJECT_CATALOG)[number];

const CATALOG_SET = new Set<string>(MARKETPLACE_SUBJECT_CATALOG);

/** Synonymes et libellés prof → entrée du catalogue. */
const SUBJECT_ALIASES: Record<string, MarketplaceCatalogSubject> = {
  maths: "Mathématiques",
  mathématiques: "Mathématiques",
  "maths sup": "Maths sup / spé",
  "maths spé": "Maths sup / spé",
  "maths sup / spé": "Maths sup / spé",
  "prépa concours": "Maths sup / spé",
  "prepa concours": "Maths sup / spé",
  physique: "Physique-Chimie",
  "physique-chimie": "Physique-Chimie",
  "physique chimie": "Physique-Chimie",
  pc: "Physique-Chimie",
  "physique prépa": "Physique prépa",
  "chimie prépa": "Chimie prépa",
  chimie: "Chimie prépa",
  "si prépa": "SI prépa",
  "informatique prépa": "Informatique prépa",
  info: "Informatique",
  informatique: "Informatique",
  nsi: "NSI",
  svt: "SVT",
  ses: "SES",
  hg: "Histoire-Géographie",
  "histoire-géographie": "Histoire-Géographie",
  "histoire géo": "Histoire-Géographie",
  anglais: "Anglais",
  espagnol: "Espagnol",
  allemand: "Allemand",
  français: "Français",
  francais: "Français",
  philo: "Philosophie",
  philosophie: "Philosophie",
  "sciences de l'ingénieur": "Sciences de l'ingénieur",
  si: "Sciences de l'ingénieur",
  sti2d: "STI2D",
  stl: "STL",
  mécanique: "Mécanique",
  mecanique: "Mécanique",
  fabrication: "Mécanique",
  usinage: "Mécanique",
  électricité: "Électricité",
  electricite: "Électricité",
  électronique: "Électronique",
  electronique: "Électronique",
  robotique: "Robotique",
  cao: "CAO / DAO",
  dao: "CAO / DAO",
  "cao 3d": "CAO / DAO",
  "cao / dao": "CAO / DAO",
  solidworks: "CAO / DAO",
  rdm: "Résistance des matériaux",
  "résistance des matériaux": "Résistance des matériaux",
  python: "Python",
  algorithmique: "Algorithmique",
  data: "Algorithmique",
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeMarketplaceSubject(
  raw: string,
): MarketplaceCatalogSubject | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (CATALOG_SET.has(trimmed)) {
    return trimmed as MarketplaceCatalogSubject;
  }

  const key = normalizeKey(trimmed);
  const alias = SUBJECT_ALIASES[key];
  if (alias) return alias;

  for (const catalog of MARKETPLACE_SUBJECT_CATALOG) {
    if (normalizeKey(catalog) === key) {
      return catalog;
    }
  }

  return null;
}

export function tutorTeachesCatalogSubject(
  subjects: string[],
  catalogSubject: string,
): boolean {
  return subjects.some((raw) => {
    const normalized = normalizeMarketplaceSubject(raw);
    return normalized === catalogSubject || raw.trim() === catalogSubject;
  });
}

/** Options de filtre page d'accueil : catalogue, limité aux matières présentes sur le campus. */
export function collectHomepageSubjectOptions(
  tutors: { subjects: string[] }[],
): MarketplaceCatalogSubject[] {
  const present = new Set<MarketplaceCatalogSubject>();
  for (const tutor of tutors) {
    for (const raw of tutor.subjects) {
      const normalized = normalizeMarketplaceSubject(raw);
      if (normalized) present.add(normalized);
    }
  }
  return MARKETPLACE_SUBJECT_CATALOG.filter((subject) => present.has(subject));
}
