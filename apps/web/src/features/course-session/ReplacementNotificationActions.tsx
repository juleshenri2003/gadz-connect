import { Button } from "@gadz-connect/ui";
import {
  useAcceptReplacement,
  useDeclineReplacement,
  useProposeReplacement,
  useReplacementProposals,
} from "@/features/course-session/useCourseSession";

interface ReplacementNotificationActionsProps {
  kind: string;
  notificationId: string;
  courseId: string | null;
  audience: "student" | "teacher";
}

function providerName(
  provider: { first_name: string; last_name: string } | null,
): string {
  if (!provider) return "Professeur";
  return `${provider.first_name} ${provider.last_name}`.trim() || "Professeur";
}

export function ReplacementNotificationActions({
  kind,
  notificationId,
  courseId,
  audience,
}: ReplacementNotificationActionsProps) {
  const propose = useProposeReplacement();
  const accept = useAcceptReplacement();
  const decline = useDeclineReplacement();
  const { data: proposals } = useReplacementProposals(
    kind === "replacement_candidate" && courseId ? courseId : null,
  );

  if (kind === "replacement_offer" && audience === "teacher") {
    return (
      <Button
        type="button"
        size="sm"
        disabled={propose.isPending}
        onClick={() => void propose.mutateAsync({ notificationId })}
      >
        {propose.isPending ? "Envoi…" : "Je peux assurer ce cours"}
      </Button>
    );
  }

  if (kind === "replacement_candidate" && audience === "student" && proposals) {
    if (proposals.length === 0) {
      return (
        <p className="text-xs text-ink-500">
          Chargement des candidats remplaçants…
        </p>
      );
    }

    return (
      <ul className="mt-2 space-y-2">
        {proposals.map((proposal) => (
          <li
            key={proposal.id}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
          >
            <p className="font-medium text-ink-900">
              {providerName(proposal.proposed_provider)}
            </p>
            {proposal.message ? (
              <p className="mt-1 text-xs text-ink-600">{proposal.message}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={accept.isPending}
                onClick={() => void accept.mutateAsync(proposal.id)}
              >
                Accepter
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={decline.isPending}
                onClick={() => void decline.mutateAsync(proposal.id)}
              >
                Refuser
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return null;
}
