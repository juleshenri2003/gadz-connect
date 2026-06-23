import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useTutorListFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject")?.trim() || null;
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [query, setQueryState] = useState(initialQuery);
  const [subjectFilter, setSubjectFilterState] = useState<string | null>(
    initialSubject,
  );

  useEffect(() => {
    setQueryState(searchParams.get("q")?.trim() ?? "");
    setSubjectFilterState(searchParams.get("subject")?.trim() || null);
  }, [searchParams]);

  function syncUrl(nextQuery: string, nextSubject: string | null) {
    const params = new URLSearchParams(searchParams);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    if (nextSubject) params.set("subject", nextSubject);
    else params.delete("subject");
    setSearchParams(params, { replace: true });
  }

  function setQuery(value: string) {
    setQueryState(value);
    syncUrl(value, subjectFilter);
  }

  function setSubjectFilter(value: string | null) {
    setSubjectFilterState(value);
    syncUrl(query, value);
  }

  return { query, setQuery, subjectFilter, setSubjectFilter };
}
