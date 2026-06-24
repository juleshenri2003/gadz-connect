import { cn } from "@gadz-connect/ui";
import { Briefcase, ExternalLink, Globe, GraduationCap, Link2 } from "lucide-react";
import {
  getProfileLinkLabel,
  type ProfileLinkKind,
  type TutorProfileLink,
} from "./profileLinks";

function LinkKindIcon({
  kind,
  className,
}: {
  kind: ProfileLinkKind;
  className?: string;
}) {
  const props = { className: cn("h-3.5 w-3.5 shrink-0", className), "aria-hidden": true as const };

  switch (kind) {
    case "linkedin":
      return <Briefcase {...props} />;
    case "google_scholar":
      return <GraduationCap {...props} />;
    case "website":
      return <Globe {...props} />;
    case "other":
      return <Link2 {...props} />;
  }
}

interface TutorProfileLinksProps {
  links: TutorProfileLink[] | undefined;
  className?: string;
}

export function TutorProfileLinks({ links, className }: TutorProfileLinksProps) {
  const visible = (links ?? []).filter((link) => link.url.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visible.map((link, index) => {
        const label = getProfileLinkLabel(link);
        return (
          <a
            key={`${link.kind}-${link.url}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-surface px-3 py-1 text-xs font-medium text-brand-700 shadow-surface transition hover:border-brand-600/30 hover:bg-brand-50"
          >
            <LinkKindIcon kind={link.kind} />
            <span>{label}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
