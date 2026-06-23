import { useEffect } from "react";

const DEFAULT_TITLE = "Gadz'Connect";
const DEFAULT_DESCRIPTION =
  "Tutorat inter-campus Arts et Métiers — trouvez un professeur sur votre campus.";

export interface PageMetaOptions {
  title?: string;
  description?: string;
  /** URL canonique pour Open Graph (défaut : location.href). */
  url?: string;
}

function setMetaTag(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
): HTMLMetaElement {
  let meta = document.querySelector(`${selector}[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
  return meta as HTMLMetaElement;
}

export function usePageMeta(
  title?: string,
  description: string = DEFAULT_DESCRIPTION,
  options?: Omit<PageMetaOptions, "title" | "description">,
): void {
  const ogUrl = options?.url;

  useEffect(() => {
    const fullTitle = title ? `${title} · Gadz'Connect` : DEFAULT_TITLE;
    document.title = fullTitle;

    setMetaTag("meta", "name", "description", description);
    setMetaTag("meta", "property", "og:title", fullTitle);
    setMetaTag("meta", "property", "og:description", description);
    setMetaTag("meta", "property", "og:type", "website");
    setMetaTag("meta", "name", "twitter:card", "summary");
    setMetaTag("meta", "name", "twitter:title", fullTitle);
    setMetaTag("meta", "name", "twitter:description", description);

    const resolvedUrl =
      ogUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    if (resolvedUrl) {
      setMetaTag("meta", "property", "og:url", resolvedUrl);
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, ogUrl]);
}
