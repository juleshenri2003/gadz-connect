import { Button } from "@gadz-connect/ui";
import { formatEuro } from "@/features/admin/format";
import type { ReplacementProposal } from "./useReplacements";

interface ReplacementProposalCardProps {
  proposal: ReplacementProposal;
  showActions?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  acceptPending?: boolean;
  declinePending?: boolean;
}

export function ReplacementProposalCard({
  proposal,
  showActions = false,
  onAccept,
  onDecline,
  acceptPending = false,
  declinePending = false,
}: ReplacementProposalCardProps) {
  const provider = proposal.proposed_provider;
  const name = provider
    ? `${provider.first_name} ${provider.last_name}`.trim()
    : "Professeur";

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          {provider?.hourly_rate ? (
            <p className="text-xs text-slate-500">
              {formatEuro(provider.hourly_rate)} / h
            </p>
          ) : null}
          {provider?.subjects?.length ? (
            <p className="mt-1 text-xs text-indigo-700">
              {provider.subjects.join(" · ")}
            </p>
          ) : null}
          {provider?.bio ? (
            <p className="mt-2 text-slate-600">{provider.bio}</p>
          ) : null}
          {proposal.message ? (
            <p className="mt-2 italic text-slate-600">
              « {proposal.message} »
            </p>
          ) : null}
        </div>
        {proposal.status !== "pending" ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {proposal.status === "accepted"
              ? "Acceptée"
              : proposal.status === "declined"
                ? "Refusée"
                : proposal.status}
          </span>
        ) : null}
      </div>
      {showActions && proposal.status === "pending" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={acceptPending}
            onClick={onAccept}
          >
            {acceptPending ? "Confirmation…" : "Accepter ce prof"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={declinePending}
            onClick={onDecline}
          >
            Refuser
          </Button>
        </div>
      ) : null}
    </div>
  );
}
