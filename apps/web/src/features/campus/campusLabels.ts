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

/** Campus pilote marketing — fallback visiteurs sans préférence enregistrée. */
export const DEFAULT_PILOT_CAMPUS_NAME = "Aix";

export function getStoredCampusId(): string {
  try {
    const fromLocal = localStorage.getItem(SELECTED_CAMPUS_KEY);
    if (fromLocal) return fromLocal;
    const fromSession = sessionStorage.getItem(SELECTED_CAMPUS_KEY);
    if (fromSession) {
      localStorage.setItem(SELECTED_CAMPUS_KEY, fromSession);
      return fromSession;
    }
  } catch {
    /* stockage indisponible (navigation privée, quota…) */
  }
  return "";
}

export function persistCampusId(id: string): void {
  try {
    localStorage.setItem(SELECTED_CAMPUS_KEY, id);
    sessionStorage.setItem(SELECTED_CAMPUS_KEY, id);
  } catch {
    /* ignore */
  }
}

export function defaultCampusId<T extends { id: string; name: string }>(
  campuses: T[],
): string | null {
  const pilot = campuses.find((c) => c.name === DEFAULT_PILOT_CAMPUS_NAME);
  return pilot?.id ?? campuses[0]?.id ?? null;
}

/** Slugs URL SEO : /campus/{slug}/tuteurs */
export const CAMPUS_SLUGS: Record<string, string> = {
  Lille: "lille",
  Bordeaux: "bordeaux",
  Paris: "paris",
  Aix: "aix-en-provence",
  Metz: "metz",
  Angers: "angers",
  Cluny: "cluny",
  Châlons: "chalon-en-champagne",
};

const SLUG_TO_CAMPUS_NAME = new Map(
  Object.entries(CAMPUS_SLUGS).map(([name, slug]) => [slug, name]),
);

export function campusDisplayName(dbName: string): string {
  return CAMPUS_DISPLAY_NAMES[dbName] ?? dbName;
}

export function campusSlugFromName(dbName: string): string {
  return CAMPUS_SLUGS[dbName] ?? dbName.toLowerCase().replace(/\s+/g, "-");
}

export function campusNameFromSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return SLUG_TO_CAMPUS_NAME.get(normalized) ?? null;
}

export function resolveCampusIdFromSlug<T extends { id: string; name: string }>(
  slug: string,
  campuses: T[],
): string | null {
  const dbName = campusNameFromSlug(slug);
  if (dbName) {
    const match = campuses.find((c) => c.name === dbName);
    if (match) return match.id;
  }
  const normalized = slug.trim().toLowerCase();
  const bySlug = campuses.find(
    (c) => campusSlugFromName(c.name) === normalized,
  );
  return bySlug?.id ?? null;
}

/** Param campagne RH : ?campus=aix ou ?campus=aix-en-provence */
export function resolveCampusIdFromParam<T extends { id: string; name: string }>(
  param: string,
  campuses: T[],
): string | null {
  const trimmed = param.trim();
  if (!trimmed) return null;
  const bySlug = resolveCampusIdFromSlug(trimmed, campuses);
  if (bySlug) return bySlug;
  const lower = trimmed.toLowerCase();
  const byName = campuses.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      campusDisplayName(c.name).toLowerCase() === lower,
  );
  return byName?.id ?? null;
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
