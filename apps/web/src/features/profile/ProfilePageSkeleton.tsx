import { Card, CardContent, CardHeader } from "@gadz-connect/ui";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line ${className ?? "h-4 w-full"}`}
    />
  );
}

interface ProfilePageSkeletonProps {
  variant?: "student" | "teacher";
}

export function ProfilePageSkeleton({
  variant = "teacher",
}: ProfilePageSkeletonProps) {
  const student = variant === "student";

  return (
    <div
      className={student ? "mx-auto max-w-2xl space-y-6" : "space-y-8"}
      aria-busy="true"
      aria-label="Chargement du profil"
    >
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      <Card className="border-line">
        <CardHeader>
          <SkeletonLine className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: student ? 3 : 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {student ? (
        <Card className="border-line">
          <CardHeader>
            <SkeletonLine className="h-5 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLine key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-line">
          <CardHeader>
            <SkeletonLine className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonLine className="h-24 w-full" />
            <SkeletonLine className="h-10 w-32" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
