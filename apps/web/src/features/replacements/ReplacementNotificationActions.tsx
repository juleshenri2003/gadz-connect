import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useAcceptReplacement,
  useDeclineReplacement,
  useDeclineReplacementOffer,
  useDismissReplacement,
  useProposeReplacement,
  useReplacementMyResponse,
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

  const notificationId =
    n?.replacement_status === "open" && n?.kind === "prof_unavailable"
      ? n.id
      : null;

  const [message, setMessage] = useState("");
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: myResponse } = useReplacementMyResponse(
    isTeacher ? notificationId : null,
  );
  const { data: proposals, isError: proposalsError } =
    useReplacementProposals(student ? notificationId : null);

  const propose = useProposeReplacement();
  const declineOffer = useDeclineReplacementOffer();
  const accept = useAcceptReplacement();
  const decline = useDeclineReplacement();
  const dismiss = useDismissReplacement();

  if (!n) return null;

  const isDeclarant = profile?.id === n.declared_by;
  const isOpenProfReplacement =
    n.kind === "prof_unavailable" && n.replacement_status === "open";

  if (!isOpenProfReplacement) return null;

  async function handlePropose() {
    if (!n) return;
    setActionError(null);
    try {
      await propose.mutateAsync({
        notificationId: n.id,
        message: message.trim() || undefined,
      });
      setShowProposeForm(false);
      setMessage("");
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleDeclineOffer() {
    if (!n) return;
    setActionError(null);
    try {
      await declineOffer.mutateAsync(n.id);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </p>
      ) : null}

      {proposalsError ? (
        <p className="text-xs text-amber-800">
          Propositions indisponibles — la migration 008 doit être appliquée dans
          Supabase.
        </p>
      ) : null}

      {student ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Choisissez votre remplaçant
          </p>
          {proposals && proposals.length > 0 ? (
            <div className="space-y-2">
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
          ) : (
            <p className="text-xs text-slate-500">
              En attente de réponses des professeurs du campus…
            </p>
          )}
        </div>
      ) : null}

      {isTeacher && !isDeclarant ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Pouvez-vous remplacer ce cours ?
          </p>

          {myResponse?.status === "proposed" ? (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              Vous avez accepté de remplacer — votre proposition est envoyée à
              l&apos;élève.
            </p>
          ) : myResponse?.status === "declined" ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Vous avez indiqué ne pas être disponible pour ce créneau.
            </p>
          ) : showProposeForm ? (
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
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={propose.isPending}
                  onClick={() => void handlePropose()}
                >
                  {propose.isPending ? "Envoi…" : "Confirmer ma proposition"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProposeForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setShowProposeForm(true)}
                disabled={propose.isPending}
              >
                Oui, je peux remplacer
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={declineOffer.isPending}
                onClick={() => void handleDeclineOffer()}
              >
                {declineOffer.isPending ? "Envoi…" : "Non, indisponible"}
              </Button>
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
    </div>
  );
}
