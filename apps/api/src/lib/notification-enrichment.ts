import { supabaseAdmin } from "./supabase.js";

interface ProfileRow {
  id: string;
  role: string;
}

function refundAmountFromTransaction(row: {
  total_paid_parent?: number | null;
  amount_gross?: number | null;
}): number | null {
  const amount = row.total_paid_parent ?? row.amount_gross;
  return amount != null && Number.isFinite(amount) ? amount : null;
}

export async function enrichNotificationsForUser<
  T extends {
    read_at: string | null;
    notification: Record<string, unknown> | null;
  },
>(rows: T[], _profile: ProfileRow | null): Promise<T[]> {
  const refundCourseIds = [
    ...new Set(
      rows
        .map((row) => row.notification)
        .filter(
          (notification) =>
            notification?.kind === "refund_processed" &&
            typeof notification.course_id === "string",
        )
        .map((notification) => notification!.course_id as string),
    ),
  ];

  if (refundCourseIds.length === 0) return rows;

  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("course_id, amount_gross, total_paid_parent")
    .in("course_id", refundCourseIds);

  if (error) {
    console.error("[notifications] refund amounts:", error.message);
    return rows;
  }

  const amountByCourse = new Map<string, number>();
  for (const transaction of transactions ?? []) {
    const amount = refundAmountFromTransaction(transaction);
    if (amount != null) {
      amountByCourse.set(transaction.course_id as string, amount);
    }
  }

  return rows.map((row) => {
    const notification = row.notification;
    if (
      !notification ||
      notification.kind !== "refund_processed" ||
      typeof notification.course_id !== "string"
    ) {
      return row;
    }

    const refundAmount = amountByCourse.get(notification.course_id);
    if (refundAmount == null) return row;

    return {
      ...row,
      notification: { ...notification, refundAmount },
    };
  });
}

export async function computeTeacherActionCount(_userId: string): Promise<number> {
  return 0;
}
