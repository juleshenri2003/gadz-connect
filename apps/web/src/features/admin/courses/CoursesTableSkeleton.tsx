function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line ${className ?? "h-4 w-full"}`}
    />
  );
}

export function CoursesTableSkeleton() {
  return (
    <div
      className="space-y-3 p-4"
      aria-busy="true"
      aria-label="Chargement des cours"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLine key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CoursesPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} className="h-24 w-full rounded-md" />
        ))}
      </div>
      <SkeletonLine className="h-32 w-full rounded-md" />
      <SkeletonLine className="h-64 w-full rounded-md" />
    </div>
  );
}
