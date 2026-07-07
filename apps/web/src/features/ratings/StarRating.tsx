import { cn } from "@gadz-connect/ui";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z";

function formatStars(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

interface StarRatingDisplayProps {
  value: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function StarRatingDisplay({
  value,
  size = "md",
  showValue = true,
  className,
}: StarRatingDisplayProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="inline-flex" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1;
          const fill =
            value >= starNumber
              ? 1
              : value >= starNumber - 0.5
                ? 0.5
                : 0;

          return (
            <span key={starNumber} className={cn("relative", iconSize)}>
              <svg
                viewBox="0 0 24 24"
                className={cn(iconSize, "text-line")}
                fill="currentColor"
              >
                <path d={STAR_PATH} />
              </svg>
              {fill > 0 ? (
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "absolute inset-0 text-warning",
                    fill === 0.5 && "clip-path-half",
                  )}
                  fill="currentColor"
                  style={
                    fill === 0.5
                      ? { clipPath: "inset(0 50% 0 0)" }
                      : undefined
                  }
                >
                  <path d={STAR_PATH} />
                </svg>
              ) : null}
            </span>
          );
        })}
      </div>
      {showValue ? (
        <span className="text-sm font-medium text-ink-900">
          {formatStars(value)}/5
        </span>
      ) : null}
    </div>
  );
}

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  const options = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  return (
    <div>
      <div
        className="inline-flex gap-0.5"
        role="radiogroup"
        aria-label="Note du cours"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1;
          const leftValue = starNumber - 0.5;
          const rightValue = starNumber;

          return (
            <span key={starNumber} className="relative h-8 w-8">
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 h-8 w-8 text-line"
                fill="currentColor"
                aria-hidden
              >
                <path d={STAR_PATH} />
              </svg>
              {value != null && value >= leftValue ? (
                <svg
                  viewBox="0 0 24 24"
                  className="absolute inset-0 h-8 w-8 text-warning"
                  fill="currentColor"
                  aria-hidden
                  style={
                    value >= rightValue
                      ? undefined
                      : { clipPath: "inset(0 50% 0 0)" }
                  }
                >
                  <path d={STAR_PATH} />
                </svg>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`${formatStars(leftValue)} sur 5`}
                onClick={() => onChange(leftValue)}
              />
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`${formatStars(rightValue)} sur 5`}
                onClick={() => onChange(rightValue)}
              />
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {value != null
          ? `Votre note : ${formatStars(value)}/5`
          : "Cliquez sur une étoile (demi-étoiles possibles)"}
      </p>
      <div className="sr-only">
        {options.map((option) => (
          <span key={option}>{formatStars(option)}</span>
        ))}
      </div>
    </div>
  );
}
