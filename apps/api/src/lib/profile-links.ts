import { z } from "zod";

export const PROFILE_LINK_KINDS = [
  "linkedin",
  "google_scholar",
  "website",
  "other",
] as const;

export type ProfileLinkKind = (typeof PROFILE_LINK_KINDS)[number];

export interface PublicProfileLink {
  kind: ProfileLinkKind;
  url: string;
  label?: string;
}

function isAllowedProtocol(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

export const profileLinkSchema = z
  .object({
    kind: z.enum(PROFILE_LINK_KINDS),
    url: z.string().trim().min(1).max(500),
    label: z.string().trim().min(1).max(40).optional(),
  })
  .superRefine((value, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(value.url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL invalide",
        path: ["url"],
      });
      return;
    }

    if (!isAllowedProtocol(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seuls les liens http(s) sont autorisés",
        path: ["url"],
      });
    }

    if (value.kind === "other" && !value.label?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un libellé est requis pour un lien personnalisé",
        path: ["label"],
      });
    }
  });

export const profileLinksSchema = z.array(profileLinkSchema).max(8);

export function sanitizeProfileLink(link: PublicProfileLink): PublicProfileLink {
  const parsed = new URL(link.url.trim());
  const normalized: PublicProfileLink = {
    kind: link.kind,
    url: parsed.toString(),
  };
  if (link.kind === "other" && link.label?.trim()) {
    normalized.label = link.label.trim();
  }
  return normalized;
}

export function normalizeProfileLinks(raw: unknown): PublicProfileLink[] {
  if (!Array.isArray(raw)) return [];

  const parsed = profileLinksSchema.safeParse(raw);
  if (!parsed.success) return [];

  return parsed.data.map((link) => sanitizeProfileLink(link));
}

export function getProfileLinkLabel(link: PublicProfileLink): string {
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
