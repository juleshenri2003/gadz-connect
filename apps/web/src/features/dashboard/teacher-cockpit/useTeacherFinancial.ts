import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import type {
  TeacherFinancialSummary,
  TeacherTransactionItem,
} from "@gadz-connect/types";

export function useTeacherFinancial() {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["teacher-financial"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TeacherFinancialSummary }>(
        "/api/tutors/me/financial",
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}

export function useTeacherTransactions(limit = 8) {
  const { getAccessToken, user } = useAuth();

  return useQuery({
    queryKey: ["teacher-transactions", limit],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: TeacherTransactionItem[] }>(
        `/api/tutors/me/transactions?limit=${limit}`,
        { token },
      );
      return res.data;
    },
    enabled: Boolean(user && getAccessToken()),
  });
}
