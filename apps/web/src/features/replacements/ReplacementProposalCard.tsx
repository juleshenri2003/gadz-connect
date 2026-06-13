import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { formatEuro } from "@/features/admin/format";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
import type { ReplacementProposal } from "./useReplacements";

interface ReplacementProposalCardProps {
  proposal: ReplacementProposal;
  showActions?: boolean;
  courseSubject?: string;
  scheduledAt?: string | null;
  onAccept?: () => void;
  onDecline?: () => void;
  acceptPending?: boolean;
  declinePending?: boolean;
}

export function ReplacementProposalCard({
  proposal,
  showActions = false,
  courseSubject,
  scheduledAt,
  onAccept,
  onDecline,
  acceptPending = false,
  declinePending = false,
}: ReplacementProposalCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const provider = proposal.proposed_provider;
  const name = provider
    ? `${provider.first_name} ${provider.last_name}`.trim()
    : "Professeur";
  const profileHref = `/app/cours/${proposal.proposed_provider_id}`;

  function handleConfirmAccept() {
    onAccept?.();
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-ink-900">{name}</p>
            {provider?.hourly_rate ? (
              <p className="text-xs text-ink-400">
                {formatEuro(provider.hourly_rate)} / h
              </p>
            ) : null}
            {provider?.subjects?.length ? (
              <p className="mt-1 text-xs text-brand-700">
                {provider.subjects.join(" · ")}
              </p>
            ) : null}
            {provider?.bio ? (
              <p className="mt-2 text-ink-600">{provider.bio}</p>
            ) : null}
            {proposal.message ? (
              <p className="mt-2 italic text-ink-600">
                « {proposal.message} »
              </p>
            ) : null}
            <Link
              to={profileHref}
              className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline"
            >
              Voir la fiche →
            </Link>
          </div>
          {proposal.status !== "pending" ? (
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-600">
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
              onClick={() => setConfirmOpen(true)}
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

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!acceptPending) setConfirmOpen(false);
        }}
        title="Confirmer ce remplaçant"
        description="Le cours sera maintenu au même horaire avec ce professeur."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={acceptPending}
              onClick={() => setConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={acceptPending}
              onClick={handleConfirmAccept}
            >
              {acceptPending ? "Confirmation…" : "Confirmer le remplaçant"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-ink-600">
          {courseSubject ? (
            <p>
              <span className="font-medium text-ink-900">Cours :</span>{" "}
              {courseSubject}
            </p>
          ) : null}
          {scheduledAt ? (
            <p>
              <span className="font-medium text-ink-900">Horaire :</span>{" "}
              {formatNotificationDate(scheduledAt)}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-ink-900">Nouveau prof :</span>{" "}
            {name}
          </p>
          {provider?.hourly_rate ? (
            <p>
              <span className="font-medium text-ink-900">Tarif :</span>{" "}
              {formatEuro(provider.hourly_rate)} / h
            </p>
          ) : null}
          <p className="text-xs text-ink-400">
            Le paiement sera traité via Stripe selon le tarif de ce professeur.
          </p>
        </div>
      </Modal>
    </>
  );
}
