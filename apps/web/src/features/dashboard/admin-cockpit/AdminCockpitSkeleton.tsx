import { Card, CardContent, CardHeader } from "@gadz-connect/ui";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line ${className ?? "h-4 w-full"}`}
    />
  );
}

export function AdminCockpitSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-56" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      <SkeletonLine className="h-24 w-full rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-line">
            <CardHeader className="pb-2">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonLine className="h-40 w-full rounded-md" />
          <SkeletonLine className="h-56 w-full rounded-md" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-line">
              <CardHeader>
                <SkeletonLine className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
