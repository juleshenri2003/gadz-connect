import { KpiCard } from "@gadz-connect/ui";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "indigo" | "green" | "amber" | "slate" | "brand" | "success" | "warning";
}) {
  const className =
    accent === "indigo" || accent === "brand"
      ? "border-brand-100 bg-brand-50/40"
      : accent === "green" || accent === "success"
        ? "border-success/20 bg-success-bg/40"
        : accent === "amber" || accent === "warning"
          ? "border-warning/20 bg-warning-bg/40"
          : undefined;

  const isCritical = accent === "amber" || accent === "warning";

  return (
    <KpiCard
      label={label}
      value={value}
      hint={hint}
      accent={isCritical}
      className={className}
    />
  );
}
