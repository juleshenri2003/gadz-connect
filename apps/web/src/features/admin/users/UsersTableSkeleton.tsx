function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line ${className ?? "h-4 w-full"}`}
    />
  );
}

export function UsersTableSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Chargement des utilisateurs">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLine key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
