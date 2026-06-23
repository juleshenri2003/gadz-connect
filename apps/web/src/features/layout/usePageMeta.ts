import { useEffect } from "react";

const DEFAULT_TITLE = "Gadz'Connect";
const DEFAULT_DESCRIPTION =
  "Tutorat inter-campus Arts et Métiers — trouvez un professeur sur votre campus.";

export function usePageMeta(
  title?: string,
  description: string = DEFAULT_DESCRIPTION,
): void {
  useEffect(() => {
    document.title = title ? `${title} · Gadz'Connect` : DEFAULT_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
}
