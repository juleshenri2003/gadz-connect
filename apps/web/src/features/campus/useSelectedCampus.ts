import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  defaultCampusId,
  getStoredCampusId,
  persistCampusId,
  resolveCampusIdFromParam,
} from "./campusLabels";
import { useCampusOptions } from "./useCampusOptions";

export function useSelectedCampus() {
  const [searchParams] = useSearchParams();
  const [campusId, setCampusIdState] = useState(getStoredCampusId);

  const { campuses: sortedCampuses, isLoading } = useCampusOptions();

  const setCampusId = useCallback((id: string) => {
    persistCampusId(id);
    setCampusIdState(id);
  }, []);

  useEffect(() => {
    if (!sortedCampuses.length || campusId) return;

    const utmCampus = searchParams.get("campus");
    if (utmCampus) {
      const fromParam = resolveCampusIdFromParam(utmCampus, sortedCampuses);
      if (fromParam) {
        setCampusId(fromParam);
        return;
      }
    }

    const stored = getStoredCampusId();
    if (stored && sortedCampuses.some((c) => c.id === stored)) {
      setCampusIdState(stored);
      return;
    }

    const fallback = defaultCampusId(sortedCampuses);
    if (fallback) setCampusId(fallback);
  }, [sortedCampuses, campusId, setCampusId, searchParams]);

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
