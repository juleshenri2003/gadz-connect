/** Noms en base (migration 001) → libellés affichés */
export const CAMPUS_DISPLAY_NAMES: Record<string, string> = {
  Lille: "Lille",
  Bordeaux: "Bordeaux",
  Paris: "Paris",
  Aix: "Aix-en-Provence",
  Metz: "Metz",
  Angers: "Angers",
  Cluny: "Cluny",
  Châlons: "Châlon-en-Champagne",
};

/** Ordre du menu déroulant connexion */
export const CAMPUS_DISPLAY_ORDER = [
  "Lille",
  "Bordeaux",
  "Paris",
  "Aix",
  "Metz",
  "Angers",
  "Cluny",
  "Châlons",
] as const;

export const SELECTED_CAMPUS_KEY = "gadz_selected_campus_id";

export function campusDisplayName(dbName: string): string {
  return CAMPUS_DISPLAY_NAMES[dbName] ?? dbName;
}

export function sortCampuses<T extends { name: string }>(campuses: T[]): T[] {
  const orderIndex = new Map(
    CAMPUS_DISPLAY_ORDER.map((name, i) => [name, i]),
  );
  return [...campuses].sort(
    (a, b) =>
      (orderIndex.get(a.name as (typeof CAMPUS_DISPLAY_ORDER)[number]) ?? 99) -
      (orderIndex.get(b.name as (typeof CAMPUS_DISPLAY_ORDER)[number]) ?? 99),
  );
}
