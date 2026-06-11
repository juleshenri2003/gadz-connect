import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useAcceptReplacement,
  useDeclineReplacement,
  useDismissReplacement,
  useProposeReplacement,
  useReplacementProposals,
} from "@/features/replacements/useReplacements";
import { ReplacementProposalCard } from "@/features/replacements/ReplacementProposalCard";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";

interface ReplacementNotificationActionsProps {
  item: CampusNotificationItem;
}

export function ReplacementNotificationActions({
  item,
}: ReplacementNotificationActionsProps) {
  const n = item.notification;
  const { data: profile } = useMyProfile();
  const student = profile?.role ? isStudent(profile.role) : false;
  const isTeacher = profile?.role === "teacher";

  const [message, setMessage] = useState("");
  const [showPropose, setShowPropose] = useState(false);

  const { data: proposals } = useReplacementProposals(
    n?.replacement_status === "open" && n?.kind === "prof_unavailable"
      ? n.id
      : null,
  );

  const propose = useProposeReplacement();
  const accept = useAcceptReplacement();
  const decline = useDeclineReplacement();
  const dismiss = useDismissReplacement();

  if (!n) return null;

  const isDeclarant = profile?.id === n.declared_by;
  const isOpenProfReplacement =
    n.kind === "prof_unavailable" && n.replacement_status === "open";

  async function handlePropose() {
    if (!n) return;
    await propose.mutateAsync({
      notificationId: n.id,
      message: message.trim() || undefined,
    });
    setShowPropose(false);
    setMessage("");
  }

  if (!isOpenProfReplacement) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      {student && proposals && proposals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Propositions de remplacement ({proposals.length})
          </p>
          {proposals.map((p) => (
            <ReplacementProposalCard
              key={p.id}
              proposal={p}
              showActions
              acceptPending={accept.isPending}
              declinePending={decline.isPending}
              onAccept={() => void accept.mutateAsync(p.id)}
              onDecline={() => void decline.mutateAsync(p.id)}
            />
          ))}
        </div>
      ) : null}

      {isTeacher && !isDeclarant ? (
        <div className="space-y-2">
          {!showPropose ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPropose(true)}
            >
              Proposer de remplacer
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-indigo-200 bg-white p-3">
              <Label htmlFor={`propose-${n.id}`} className="text-xs">
                Message pour l&apos;élève (optionnel)
              </Label>
              <Input
                id={`propose-${n.id}`}
                placeholder="Ex. je maîtrise SolidWorks et suis libre à cet horaire"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={propose.isPending}
                  onClick={() => void handlePropose()}
                >
                  {propose.isPending ? "Envoi…" : "Envoyer ma proposition"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPropose(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {isDeclarant ? (
        <Button
          size="sm"
          variant="outline"
          disabled={dismiss.isPending}
          onClick={() => void dismiss.mutateAsync(n.id)}
        >
          Annuler la recherche de remplaçant
        </Button>
      ) : null}

      {student && proposals && proposals.length === 0 ? (
        <p className="text-xs text-slate-500">
          En attente de propositions de professeurs du campus…
        </p>
      ) : null}
    </div>
  );
}
