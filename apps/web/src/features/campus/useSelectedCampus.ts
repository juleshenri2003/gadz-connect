import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { SELECTED_CAMPUS_KEY, sortCampuses } from "./campusLabels";
import { apiFetch } from "@/lib/api";

export interface CampusOption {
  id: string;
  name: string;
}

function readStoredCampusId(): string {
  return sessionStorage.getItem(SELECTED_CAMPUS_KEY) ?? "";
}

export function useSelectedCampus() {
  const [campusId, setCampusIdState] = useState(readStoredCampusId);

  const { data: campuses, isLoading } = useQuery({
    queryKey: ["campus"],
    queryFn: () =>
      apiFetch<{ data: CampusOption[] }>("/api/campus").then((res) => res.data),
  });

  const sortedCampuses = campuses ? sortCampuses(campuses) : [];

  const setCampusId = useCallback((id: string) => {
    sessionStorage.setItem(SELECTED_CAMPUS_KEY, id);
    setCampusIdState(id);
  }, []);

  useEffect(() => {
    if (!sortedCampuses.length || campusId) return;
    const stored = readStoredCampusId();
    if (stored && sortedCampuses.some((c) => c.id === stored)) {
      setCampusIdState(stored);
      return;
    }
    const paris = sortedCampuses.find((c) => c.name === "Paris");
    if (paris) setCampusId(paris.id);
  }, [sortedCampuses, campusId, setCampusId]);

  const selectedCampus =
    sortedCampuses.find((c) => c.id === campusId) ?? null;

  return {
    campusId: campusId || null,
    selectedCampus,
    campuses: sortedCampuses,
    setCampusId,
    isLoading,
  };
}
