import { cn } from "@gadz-connect/ui";
import inpiLogo from "./assets/inpi.png";
import stripeLogo from "./assets/stripe.svg";
import urssafLogo from "./assets/urssaf.svg";

export type BrandId = "inpi" | "urssaf" | "stripe";

const SIZE_CLASS = {
  sm: "h-4",
  md: "h-5",
} as const;

const BRAND_SIZE_CLASS: Partial<
  Record<BrandId, Partial<Record<keyof typeof SIZE_CLASS, string>>>
> = {
  inpi: { sm: "h-3", md: "h-3.5" },
};

const BRAND_SRC: Record<BrandId, string> = {
  inpi: inpiLogo,
  urssaf: urssafLogo,
  stripe: stripeLogo,
};

const BRAND_LABEL: Record<BrandId, string> = {
  inpi: "INPI",
  urssaf: "URSSAF",
  stripe: "Stripe",
};

interface BrandLogoProps {
  brand: BrandId;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  decorative?: boolean;
}

export function BrandLogo({
  brand,
  size = "md",
  className,
  decorative = false,
}: BrandLogoProps) {
  return (
    <img
      src={BRAND_SRC[brand]}
      alt={decorative ? "" : BRAND_LABEL[brand]}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "w-auto max-w-full shrink-0 object-contain object-left",
        BRAND_SIZE_CLASS[brand]?.[size] ?? SIZE_CLASS[size],
        className,
      )}
    />
  );
}
