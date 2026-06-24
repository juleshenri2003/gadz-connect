import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
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

      {showSubjectPills && isCompact ? (
        <CompactSubjectFilter
          subjectFilter={subjectFilter}
          subjectOptions={subjectOptions}
          subjectsExpanded={subjectsExpanded}
          onToggleExpanded={() => setSubjectsExpanded((open) => !open)}
          onSubjectChange={handleSubjectChange}
        />
      ) : null}

      {topSubjects.length > 0 && isCompact ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-500">Populaires :</span>
          {topSubjects.map((subject) => (
            <button
              key={subject}
              type="button"
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs font-medium transition",
                subjectFilter === subject
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-brand-100 bg-brand-50 text-brand-700 hover:border-brand-200 hover:bg-brand-100",
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

      {showSubjectPills && !isCompact ? (
        <div className="flex flex-wrap gap-2">
          <SubjectPills
            subjectFilter={subjectFilter}
            subjectOptions={subjectOptions}
            onSubjectChange={handleSubjectChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function CompactSubjectFilter({
  subjectFilter,
  subjectOptions,
  subjectsExpanded,
  onToggleExpanded,
  onSubjectChange,
}: {
  subjectFilter: string | null;
  subjectOptions: string[];
  subjectsExpanded: boolean;
  onToggleExpanded: () => void;
  onSubjectChange: (value: string | null) => void;
}) {
  const hasFilter = subjectFilter != null;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex overflow-hidden rounded-sm border transition",
          hasFilter || subjectsExpanded
            ? "border-brand-200 bg-brand-50"
            : "border-line bg-surface hover:border-brand-200",
        )}
      >
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition",
            hasFilter ? "text-brand-800" : "text-ink-900",
          )}
          onClick={onToggleExpanded}
          aria-expanded={subjectsExpanded}
        >
          <BookOpen
            className="h-4 w-4 shrink-0 text-brand-600"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">
            {hasFilter ? (
              <>
                <span className="font-normal text-brand-700">Matière · </span>
                {subjectFilter}
              </>
            ) : (
              <>
                Filtrer par matière
                <span className="font-normal text-ink-500">
                  {` · ${subjectOptions.length} disponible${subjectOptions.length > 1 ? "s" : ""}`}
                </span>
              </>
            )}
          </span>
          {subjectsExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          )}
        </button>

        {hasFilter ? (
          <button
            type="button"
            className="shrink-0 border-l border-brand-200 px-3 text-brand-700 transition hover:bg-brand-100"
            onClick={() => onSubjectChange(null)}
            aria-label="Effacer le filtre matière"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {subjectsExpanded ? (
        <div className="rounded-sm border border-line bg-paper p-3">
          <SubjectPills
            subjectFilter={subjectFilter}
            subjectOptions={subjectOptions}
            onSubjectChange={onSubjectChange}
          />
        </div>
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
          "rounded-sm border px-3 py-1.5 text-xs font-medium transition",
          subjectFilter === null
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-line bg-surface text-ink-600 hover:border-brand-100 hover:bg-brand-50",
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
            "rounded-sm border px-3 py-1.5 text-xs font-medium transition",
            subjectFilter === subject
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-brand-100 bg-surface text-brand-700 hover:border-brand-200 hover:bg-brand-50",
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
