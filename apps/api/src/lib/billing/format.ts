export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatSiretDisplay(siret: string): string {
  const normalized = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(normalized)) return siret;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
}

export function formatFrenchDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatFrenchDateTimeRange(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string {
  if (!startsAt) return "—";
  const start = new Date(startsAt);
  const datePart = start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!endsAt) return `${datePart}, ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${startTime} – ${endTime}`;
}

export function formatInvoiceNumber(
  prefix: "PARENT" | "STUDENT",
  sequence: number,
): string {
  const year = new Date().getFullYear();
  return `GC-${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}
