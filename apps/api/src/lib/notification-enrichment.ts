interface ProfileRow {
  id: string;
  role: string;
}

export async function enrichNotificationsForUser<
  T extends {
    read_at: string | null;
    notification: Record<string, unknown> | null;
  },
>(rows: T[], _profile: ProfileRow | null): Promise<T[]> {
  return rows;
}

export async function computeTeacherActionCount(_userId: string): Promise<number> {
  return 0;
}
