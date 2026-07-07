const HOUR_MS = 60 * 60 * 1000;

export function getConfirmationHoursBefore(): number {
  const raw = Number(process.env.COURSE_CONFIRMATION_HOURS_BEFORE ?? "24");
  return Number.isFinite(raw) && raw > 0 ? raw : 24;
}

export function getReplacementDeadlineHours(): number {
  const raw = Number(process.env.COURSE_REPLACEMENT_DEADLINE_HOURS ?? "2");
  return Number.isFinite(raw) && raw > 0 ? raw : 2;
}

export function computeReplacementExpiresAt(scheduledAt: string): string {
  const deadlineMs =
    new Date(scheduledAt).getTime() -
    getReplacementDeadlineHours() * HOUR_MS;
  return new Date(deadlineMs).toISOString();
}

export function confirmationReminderWindow(now = new Date()): {
  from: string;
  to: string;
} {
  const hours = getConfirmationHoursBefore();
  const fromMs = now.getTime() + (hours - 1) * HOUR_MS;
  const toMs = now.getTime() + (hours + 1) * HOUR_MS;
  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  };
}

export function isPastReplacementDeadline(
  replacementExpiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!replacementExpiresAt) return false;
  return now.getTime() >= new Date(replacementExpiresAt).getTime();
}

export function isPastConfirmationEscalation(
  scheduledAt: string,
  now = new Date(),
): boolean {
  const deadlineMs =
    new Date(scheduledAt).getTime() -
    getReplacementDeadlineHours() * HOUR_MS;
  return now.getTime() >= deadlineMs;
}
