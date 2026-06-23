import { cn, Input } from "@gadz-connect/ui";

interface TutorListFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  subjectFilter: string | null;
  onSubjectFilterChange: (value: string | null) => void;
  subjectOptions: string[];
}

export function TutorListFilters({
  query,
  onQueryChange,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
}: TutorListFiltersProps) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-surface p-4">
      <Input
        type="search"
        placeholder="Rechercher par nom, matière ou description…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Rechercher un tuteur"
      />
      {subjectOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              subjectFilter === null
                ? "bg-brand-600 text-white"
                : "bg-paper text-ink-600 hover:bg-line",
            )}
            onClick={() => onSubjectFilterChange(null)}
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
                onSubjectFilterChange(
                  subjectFilter === subject ? null : subject,
                )
              }
            >
              {subject}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
