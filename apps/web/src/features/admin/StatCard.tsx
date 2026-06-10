import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "indigo" | "green" | "amber" | "slate";
}) {
  const accentClass =
    accent === "indigo"
      ? "border-indigo-100 bg-indigo-50/50"
      : accent === "green"
        ? "border-green-100 bg-green-50/50"
        : accent === "amber"
          ? "border-amber-100 bg-amber-50/50"
          : "border-slate-200 bg-white";

  return (
    <Card className={accentClass}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-xs text-slate-500">{hint}</CardContent>
      ) : null}
    </Card>
  );
}
