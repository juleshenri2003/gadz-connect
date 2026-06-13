import { cn } from "@gadz-connect/ui";
import { BrandLogo, type BrandId } from "./brands/BrandLogo";

export interface GuidePartner {
  brand: BrandId;
  label: string;
  hint?: string;
}

interface GuidePartnerStripProps {
  partners: GuidePartner[];
  className?: string;
}

export function GuidePartnerStrip({
  partners,
  className,
}: GuidePartnerStripProps) {
  const partner = partners[0];
  if (!partner) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2",
        className,
      )}
    >
      <BrandLogo brand={partner.brand} size="sm" decorative />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{partner.label}</p>
        {partner.hint ? (
          <p className="text-xs text-ink-400">{partner.hint}</p>
        ) : null}
      </div>
    </div>
  );
}
