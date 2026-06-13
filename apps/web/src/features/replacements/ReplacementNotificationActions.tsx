import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
import {
  useAcceptReplacement,
  useDeclineReplacement,
  useDeclineReplacementOffer,
  useDismissReplacement,
  useProposeReplacement,
  useReplacementProposals,
} from "@/features/replacements/useReplacements";
import { ReplacementProposalCard } from "@/features/replacements/ReplacementProposalCard";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";

interface ReplacementNotificationActionsProps {
  item: CampusNotificationItem;
  onActionComplete?: () => void;
}

export function ReplacementNotificationActions({
  item,
  onActionComplete,
}: ReplacementNotificationActionsProps) {
  const n = item.notification;
  const { data: profile } = useMyProfile();
  const student = profile?.role ? isStudent(profile.role) : false;
  const isTeacher = profile?.role === "teacher";
  const isSiteAdmin =
    profile?.role === "admin_general" || profile?.role === "admin_campus";

  const notificationId =
    n?.replacement_status === "open" && n?.kind === "prof_unavailable"
      ? n.id
      : null;

  const [message, setMessage] = useState("");
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isDeclarant = profile?.id === n?.declared_by;
  const teacherResponse = n?.teacher_response ?? "none";

  const canViewProposals = student || isDeclarant || isSiteAdmin;
  const { data: proposals, isError: proposalsError } = useReplacementProposals(
    canViewProposals ? notificationId : null,
  );

  const propose = useProposeReplacement();
  const declineOffer = useDeclineReplacementOffer();
  const accept = useAcceptReplacement();
  const decline = useDeclineReplacement();
  const dismiss = useDismissReplacement();

  if (!n) return null;

  const isOpenProfReplacement =
    n.kind === "prof_unavailable" && n.replacement_status === "open";

  if (!isOpenProfReplacement) return null;

  const subject = n.subject ?? "Cours";
  const scheduleLabel = n.scheduled_at
    ? formatNotificationDate(n.scheduled_at)
    : null;

  const pendingCount =
    n.pending_proposals_count ?? proposals?.length ?? 0;

  async function handlePropose() {
    setActionError(null);
    try {
      await propose.mutateAsync({
        notificationId: n!.id,
        message: message.trim() || undefined,
      });
      setShowProposeForm(false);
      setMessage("");
      onActionComplete?.();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleDeclineOffer() {
    setActionError(null);
    try {
      await declineOffer.mutateAsync(n!.id);
      onActionComplete?.();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleDismiss() {
    const confirmed = window.confirm(
      isSiteAdmin
        ? "Clôturer ce dossier de remplacement ? Le cours sera annulé et les propositions expirées."
        : "Annuler la recherche de remplaçant pour ce cours ? L'alerte sera clôturée.",
    );
    if (!confirmed) return;
    await dismiss.mutateAsync(n!.id);
    onActionComplete?.();
  }

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      {actionError ? (
        <p className="rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-xs text-danger">
          {actionError}
        </p>
      ) : null}

      {proposalsError ? (
        <p className="text-xs text-warning">
          Les propositions ne sont pas disponibles pour le moment. Contactez
          l&apos;équipe de pilotage si le problème persiste.
        </p>
      ) : null}

      {student ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Choisissez votre remplaçant
          </p>
          {proposals && proposals.length > 0 ? (
            <div className="space-y-2">
              {proposals.map((p) => (
                <ReplacementProposalCard
                  key={p.id}
                  proposal={p}
                  showActions
                  courseSubject={subject}
                  scheduledAt={n.scheduled_at}
                  acceptPending={accept.isPending}
                  declinePending={decline.isPending}
                  onAccept={() => void accept.mutateAsync(p.id)}
                  onDecline={() => void decline.mutateAsync(p.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-400">
              En attente de réponses des professeurs du campus…
            </p>
          )}
        </div>
      ) : null}

      {isDeclarant ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Suivi de votre indisponibilité
          </p>
          <p className="text-xs text-ink-600">
            {pendingCount > 0
              ? `${pendingCount} proposition${pendingCount > 1 ? "s" : ""} reçue${pendingCount > 1 ? "s" : ""} — en attente du choix de l'élève.`
              : "En attente de propositions de vos collègues du campus…"}
          </p>
          {proposals && proposals.length > 0 ? (
            <div className="space-y-2">
              {proposals.map((p) => {
                const name = p.proposed_provider
                  ? `${p.proposed_provider.first_name} ${p.proposed_provider.last_name}`.trim()
                  : "Professeur";
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-600"
                  >
                    <span className="font-medium text-ink-900">{name}</span>
                    {p.message ? (
                      <span className="text-ink-600"> — « {p.message} »</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={dismiss.isPending}
            onClick={() => void handleDismiss()}
          >
            Annuler la recherche de remplaçant
          </Button>
        </div>
      ) : null}

      {isTeacher && !isDeclarant ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Pouvez-vous remplacer ce cours ?
          </p>
          <p className="text-xs text-ink-600">
            <span className="font-medium text-ink-900">{subject}</span>
            {scheduleLabel ? ` — ${scheduleLabel}` : ""}
          </p>

          {teacherResponse === "proposed" ? (
            <p className="rounded-md border border-success/20 bg-success-bg px-3 py-2 text-xs text-success">
              Vous avez accepté de remplacer — votre proposition est envoyée à
              l&apos;élève.
            </p>
          ) : teacherResponse === "declined" ? (
            <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-600">
              Vous avez indiqué ne pas être disponible pour ce créneau.
            </p>
          ) : showProposeForm ? (
            <div className="space-y-2 rounded-lg border border-brand-100 bg-surface p-3">
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

      {isSiteAdmin && !student && !isDeclarant && !isTeacher ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
            Supervision pilotage RH
          </p>
          <p className="text-xs text-ink-600">
            Action réservée au pilotage — clôturer annule le cours et libère le
            créneau si applicable.
          </p>
          {proposals && proposals.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-900">
                Propositions en attente ({proposals.length})
              </p>
              {proposals.map((p) => {
                const name = p.proposed_provider
                  ? `${p.proposed_provider.first_name} ${p.proposed_provider.last_name}`.trim()
                  : "Professeur";
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-600"
                  >
                    <span className="font-medium text-ink-900">{name}</span>
                    {p.message ? (
                      <span className="text-ink-600"> — « {p.message} »</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ink-400">
              Aucune proposition prof reçue pour le moment.
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={dismiss.isPending}
            onClick={() => void handleDismiss()}
          >
            {dismiss.isPending
              ? "Clôture…"
              : "Clôturer la recherche de remplaçant"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
