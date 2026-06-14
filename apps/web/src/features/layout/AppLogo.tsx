import { cn } from "@gadz-connect/ui";
import logoSrc from "@/assets/logo.png";

interface AppLogoProps {
  className?: string;
  decorative?: boolean;
}

export function AppLogo({ className, decorative = false }: AppLogoProps) {
  return (
    <img
      src={logoSrc}
      alt={decorative ? "" : "Gadz'Connect"}
      className={cn("h-8 w-auto shrink-0 object-contain", className)}
      aria-hidden={decorative}
    />
  );
}
