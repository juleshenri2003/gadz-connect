export function AdminBudgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-paper" />
        <div className="h-4 w-96 animate-pulse rounded bg-paper" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-md border border-line bg-paper"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-md border border-line bg-paper"
          />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-md border border-line bg-paper" />
    </div>
  );
}
