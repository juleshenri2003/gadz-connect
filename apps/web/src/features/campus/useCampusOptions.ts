import { useQuery } from "@tanstack/react-query";
import { sortCampuses } from "./campusLabels";
import { apiFetch } from "@/lib/api";
import type { CampusOption } from "./campusLabels";

export function useCampusOptions(enabled = true) {
  const query = useQuery({
    queryKey: ["campus"],
    queryFn: () =>
      apiFetch<{ data: CampusOption[] }>("/api/campus").then((res) => res.data),
    enabled,
  });

  const campuses = query.data ? sortCampuses(query.data) : [];

  return {
    campuses,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
