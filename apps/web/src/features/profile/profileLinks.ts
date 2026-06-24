export const PROFILE_LINK_KINDS = [
  "linkedin",
  "google_scholar",
  "website",
  "other",
] as const;

export type ProfileLinkKind = (typeof PROFILE_LINK_KINDS)[number];

export interface TutorProfileLink {
  kind: ProfileLinkKind;
  url: string;
  label?: string;
}

export const PROFILE_LINK_KIND_OPTIONS: {
  value: ProfileLinkKind;
  label: string;
}[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "google_scholar", label: "Google Scholar" },
  { value: "website", label: "Site web" },
  { value: "other", label: "Autre…" },
];

export function getProfileLinkLabel(link: TutorProfileLink): string {
  switch (link.kind) {
    case "linkedin":
      return "LinkedIn";
    case "google_scholar":
      return "Google Scholar";
    case "website":
      return "Site web";
    case "other":
      return link.label?.trim() || "Lien";
  }
}

export function createEmptyProfileLink(
  kind: ProfileLinkKind = "linkedin",
): TutorProfileLink {
  return { kind, url: "" };
}

export function normalizeProfileLinksForSave(
  links: TutorProfileLink[],
): TutorProfileLink[] {
  return links
    .map((link) => ({
      kind: link.kind,
      url: link.url.trim(),
      ...(link.kind === "other" && link.label?.trim()
        ? { label: link.label.trim() }
        : {}),
    }))
    .filter((link) => link.url.length > 0);
}
