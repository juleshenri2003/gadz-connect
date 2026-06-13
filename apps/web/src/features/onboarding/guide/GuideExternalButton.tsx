import { Button } from "@gadz-connect/ui";
import { BrandLogo, type BrandId } from "./brands/BrandLogo";

interface GuideExternalButtonProps {
  href: string;
  label: string;
  brand?: BrandId;
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0 opacity-60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4.5 2.5h5v5M9.5 2.5 2.5 9.5" strokeLinecap="round" />
    </svg>
  );
}

export function GuideExternalButton({
  href,
  label,
  brand,
}: GuideExternalButtonProps) {
  return (
    <Button variant="outline" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {brand ? <BrandLogo brand={brand} size="sm" decorative /> : null}
        <span>{label}</span>
        <ExternalLinkIcon />
      </a>
    </Button>
  );
}
