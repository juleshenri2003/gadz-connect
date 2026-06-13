import { cn } from "@gadz-connect/ui";
import { useMarkInpiSent } from "@/features/onboarding/progress/useMarkInpiSent";

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface GuideManualConfirmProps {
  confirmed: boolean;
  label?: string;
}

export function GuideManualConfirm({
  confirmed,
  label = "J'ai envoyé ma demande sur l'INPI",
}: GuideManualConfirmProps) {
  const setInpiSent = useMarkInpiSent();

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
        confirmed
          ? "border-success/20 bg-success-bg/70"
          : "border-line bg-surface hover:border-line",
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={confirmed}
        onChange={() => setInpiSent.mutate(!confirmed)}
      />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          confirmed
            ? "border-success bg-success text-white"
            : "border-line bg-surface",
        )}
        aria-hidden
      >
        {confirmed ? <CheckMark /> : null}
      </span>
      <span
        className={cn(
          "text-sm",
          confirmed ? "font-medium text-success" : "text-ink-600",
        )}
      >
        {label}
      </span>
      {setInpiSent.isError ? (
        <span className="ml-auto text-xs text-danger" role="alert">
          Erreur
        </span>
      ) : null}
    </label>
  );
}
