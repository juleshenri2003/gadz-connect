const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function getConfirmationHoursBefore(): number {
  const raw = Number(process.env.COURSE_CONFIRMATION_HOURS_BEFORE ?? "24");
  return Number.isFinite(raw) && raw > 0 ? raw : 24;
}

export function getReplacementDeadlineHours(): number {
  const raw = Number(process.env.COURSE_REPLACEMENT_DEADLINE_HOURS ?? "2");
  return Number.isFinite(raw) && raw > 0 ? raw : 2;
}

/** Délai avant litige admin si double confirmation post-séance manquante. */
export function getSessionConfirmationDisputeDays(): number {
  const raw = Number(process.env.SESSION_CONFIRMATION_DISPUTE_DAYS ?? "7");
  return Number.isFinite(raw) && raw > 0 ? raw : 7;
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

/** J+1 / J+3 après le cours : fenêtres de rappel post-séance. */
export function shouldSendPostSessionReminder(
  scheduledAt: string,
  reminderCount: number,
  now = new Date(),
): boolean {
  const elapsed = now.getTime() - new Date(scheduledAt).getTime();
  if (reminderCount < 1 && elapsed >= DAY_MS) return true;
  if (reminderCount < 2 && elapsed >= 3 * DAY_MS) return true;
  return false;
}

export function isPastSessionConfirmationDispute(
  scheduledAt: string,
  now = new Date(),
): boolean {
  const days = getSessionConfirmationDisputeDays();
  return now.getTime() >= new Date(scheduledAt).getTime() + days * DAY_MS;
}
