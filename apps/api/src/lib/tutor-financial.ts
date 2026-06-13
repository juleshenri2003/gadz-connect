import type {
  TeacherFinancialSummary,
  UrssafPeriodicity,
} from "@gadz-connect/types";

export interface RawTransactionRow {
  amount_gross: unknown;
  net_payout: unknown;
  status_stripe: string;
  status_urssaf: string;
  created_at: string;
  course_id: string;
}

export interface RawCourseRow {
  id: string;
  status: string;
  scheduled_at: string | null;
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function shouldUrssafBeDue(
  periodicity: UrssafPeriodicity | string | null | undefined,
): boolean {
  if (periodicity === "monthly") return true;
  const month = new Date().getMonth();
  return [0, 3, 6, 9].includes(month);
}

export function isInCurrentMonth(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export function aggregateTeacherFinancial(
  transactions: RawTransactionRow[],
  courses: RawCourseRow[],
  urssafPeriodicity: UrssafPeriodicity | string | null | undefined,
  now = new Date(),
): TeacherFinancialSummary {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const nowMs = now.getTime();

  const month = {
    encaisseBrut: 0,
    encaisseNet: 0,
    enAttenteBrut: 0,
    enAttenteNet: 0,
    coursTermines: 0,
  };

  const allTime = {
    encaisseNet: 0,
    volumeBrut: 0,
  };

  const forecast = {
    brut: 0,
    net: 0,
    count: 0,
  };

  let amountToDeclare = 0;
  let undeclaredCount = 0;

  for (const tx of transactions) {
    const gross = parseAmount(tx.amount_gross);
    const net = parseAmount(tx.net_payout);
    const stripeStatus = tx.status_stripe;
    const urssafStatus = tx.status_urssaf;
    const course = courseById.get(tx.course_id);
    const inMonth = isInCurrentMonth(tx.created_at, now);

    allTime.volumeBrut += gross;

    if (stripeStatus === "succeeded") {
      allTime.encaisseNet += net;
      if (inMonth) {
        month.encaisseBrut += gross;
        month.encaisseNet += net;
      }
      if (urssafStatus === "pending") {
        amountToDeclare += net;
        undeclaredCount += 1;
      }
    } else if (stripeStatus === "pending") {
      if (inMonth) {
        month.enAttenteBrut += gross;
        month.enAttenteNet += net;
      }

      const scheduledAt = course?.scheduled_at;
      if (
        course?.status === "scheduled" &&
        scheduledAt &&
        new Date(scheduledAt).getTime() > nowMs
      ) {
        forecast.brut += gross;
        forecast.net += net;
        forecast.count += 1;
      }
    }
  }

  for (const course of courses) {
    if (course.status !== "completed" || !course.scheduled_at) continue;
    if (isInCurrentMonth(course.scheduled_at, now)) {
      month.coursTermines += 1;
    }
  }

  const periodicity =
    urssafPeriodicity === "monthly" || urssafPeriodicity === "quarterly"
      ? urssafPeriodicity
      : null;

  return {
    month: {
      encaisseBrut: round2(month.encaisseBrut),
      encaisseNet: round2(month.encaisseNet),
      enAttenteBrut: round2(month.enAttenteBrut),
      enAttenteNet: round2(month.enAttenteNet),
      coursTermines: month.coursTermines,
    },
    allTime: {
      encaisseNet: round2(allTime.encaisseNet),
      volumeBrut: round2(allTime.volumeBrut),
    },
    forecast: {
      brut: round2(forecast.brut),
      net: round2(forecast.net),
      count: forecast.count,
    },
    urssaf: {
      due: shouldUrssafBeDue(periodicity),
      periodicity,
      amountToDeclare: round2(amountToDeclare),
      undeclaredCount,
    },
  };
}
