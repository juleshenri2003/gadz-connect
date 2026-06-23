import { cn, Input } from "@gadz-connect/ui";
import { useState } from "react";

interface TutorListFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  subjectFilter: string | null;
  onSubjectFilterChange: (value: string | null) => void;
  subjectOptions: string[];
  variant?: "default" | "compact";
  bookableOnly?: boolean;
  onBookableOnlyChange?: (value: boolean) => void;
  topSubjects?: string[];
  onFilterApply?: (filter: string) => void;
}

export function TutorListFilters({
  query,
  onQueryChange,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
  variant = "default",
  bookableOnly,
  onBookableOnlyChange,
  topSubjects = [],
  onFilterApply,
}: TutorListFiltersProps) {
  const [subjectsExpanded, setSubjectsExpanded] = useState(false);

  function handleQueryChange(value: string) {
    onQueryChange(value);
    if (value.trim()) onFilterApply?.("query");
  }

  function handleSubjectChange(value: string | null) {
    onSubjectFilterChange(value);
    onFilterApply?.("subject");
  }

  function handleBookableChange(checked: boolean) {
    onBookableOnlyChange?.(checked);
    onFilterApply?.("bookable");
  }

  const showSubjectPills = subjectOptions.length > 0;
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "space-y-3",
        isCompact
          ? "rounded-md border border-line bg-surface p-3"
          : "rounded-md border border-line bg-surface p-4",
      )}
    >
      <Input
        type="search"
        placeholder="Rechercher par nom, matière ou description…"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        aria-label="Rechercher un tuteur"
      />

      {topSubjects.length > 0 && isCompact ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-500">Populaires :</span>
          {topSubjects.map((subject) => (
            <button
              key={subject}
              type="button"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition",
                subjectFilter === subject
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100",
              )}
              onClick={() =>
                handleSubjectChange(subjectFilter === subject ? null : subject)
              }
            >
              {subject}
            </button>
          ))}
        </div>
      ) : null}

      {onBookableOnlyChange != null ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            checked={bookableOnly ?? false}
            onChange={(event) => handleBookableChange(event.target.checked)}
          />
          Uniquement avec créneaux disponibles
        </label>
      ) : null}

      {showSubjectPills ? (
        isCompact ? (
          <div>
            <button
              type="button"
              className="text-xs font-medium text-brand-700 hover:underline"
              onClick={() => setSubjectsExpanded((open) => !open)}
              aria-expanded={subjectsExpanded}
            >
              Matières {subjectsExpanded ? "▴" : "▾"}
            </button>
            {subjectsExpanded ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <SubjectPills
                  subjectFilter={subjectFilter}
                  subjectOptions={subjectOptions}
                  onSubjectChange={handleSubjectChange}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <SubjectPills
              subjectFilter={subjectFilter}
              subjectOptions={subjectOptions}
              onSubjectChange={handleSubjectChange}
            />
          </div>
        )
      ) : null}
    </div>
  );
}

function SubjectPills({
  subjectFilter,
  subjectOptions,
  onSubjectChange,
}: {
  subjectFilter: string | null;
  subjectOptions: string[];
  onSubjectChange: (value: string | null) => void;
}) {
  return (
    <>
      <button
        type="button"
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition",
          subjectFilter === null
            ? "bg-brand-600 text-white"
            : "bg-paper text-ink-600 hover:bg-line",
        )}
        onClick={() => onSubjectChange(null)}
      >
        Toutes les matières
      </button>
      {subjectOptions.map((subject) => (
        <button
          key={subject}
          type="button"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            subjectFilter === subject
              ? "bg-brand-600 text-white"
              : "bg-brand-50 text-brand-700 hover:bg-brand-100",
          )}
          onClick={() =>
            onSubjectChange(subjectFilter === subject ? null : subject)
          }
        >
          {subject}
        </button>
      ))}
    </>
  );
}
