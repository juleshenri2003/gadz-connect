function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line ${className ?? "h-4 w-full"}`}
    />
  );
}

export function RepositoryFoldersSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Chargement des matières"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-line bg-surface p-5 space-y-3"
        >
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-4 w-20" />
          <SkeletonLine className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function RepositorySummariesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement des résumés">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-line bg-surface p-6 space-y-3"
        >
          <SkeletonLine className="h-5 w-48" />
          <SkeletonLine className="h-3 w-64" />
          <SkeletonLine className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
