import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useMarkNotificationRead,
  useNotifications,
  type CampusNotificationItem,
} from "@/features/notifications/useNotifications";
import { ReplacementNotificationActions } from "@/features/replacements/ReplacementNotificationActions";

const KIND_LABELS: Record<string, string> = {
  prof_unavailable: "Prof indisponible",
  student_unavailable: "Élève indisponible",
  replacement_proposed: "Proposition de remplacement",
  replacement_accepted: "Remplacement confirmé",
  replacement_declined: "Proposition refusée",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();

  const unread = data?.filter((n) => !n.read_at) ?? [];
  const read = data?.filter((n) => n.read_at) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Alertes campus</h2>
        <p className="mt-1 text-sm text-slate-600">
          Indisponibilités prof, propositions de remplacement et confirmations —
          visible par l&apos;élève, les profs du campus et l&apos;équipe de
          pilotage
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Impossible de charger les alertes.</p>
      ) : (
        <>
          {unread.length > 0 ? (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base text-amber-900">
                  Non lues ({unread.length})
                </CardTitle>
                <CardDescription>
                  Remplacements et propositions en cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unread.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={() => markRead.mutate(item.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {read.length === 0 && unread.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune alerte pour le moment.
                </p>
              ) : (
                read.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: CampusNotificationItem;
  onMarkRead?: () => void;
}) {
  const { data: profile } = useMyProfile();
  const n = item.notification;
  if (!n) return null;

  const student = profile?.role ? isStudent(profile.role) : false;
  const isSiteAdmin =
    profile?.role === "admin_general" || profile?.role === "admin_campus";

  const declarant = n.declarant
    ? `${n.declarant.first_name} ${n.declarant.last_name}`.trim()
    : "Membre";

  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        item.read_at
          ? "border-slate-200 bg-slate-50/50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{n.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {KIND_LABELS[n.kind] ?? n.kind}
            {n.campus?.name ? ` · ${n.campus.name}` : ""}
            {n.scheduled_at ? ` · ${formatDate(n.scheduled_at)}` : ""}
          </p>
        </div>
        {!item.read_at && onMarkRead ? (
          <Button type="button" size="sm" variant="outline" onClick={onMarkRead}>
            Marquer lu
          </Button>
        ) : null}
      </div>
      <p className="mt-2 text-slate-700">{n.message}</p>
      <p className="mt-2 text-xs text-slate-500">
        Déclaré par {declarant}
        {n.reason ? ` — « ${n.reason} »` : ""}
      </p>
      {n.replacement_status === "open" && n.kind === "prof_unavailable" ? (
        student ? (
          <p className="mt-2 text-xs font-medium text-amber-800">
            Votre professeur est indisponible — des remplaçants vont être
            proposés ici. Vous choisirez celui qui reprendra le cours au même
            horaire.
          </p>
        ) : isSiteAdmin ? (
          <p className="mt-2 text-xs font-medium text-slate-600">
            Suivi plateforme — cours en attente de remplacement sur le campus.
          </p>
        ) : (
          <p className="mt-2 text-xs font-medium text-indigo-700">
            Remplacement en cours — les profs du campus peuvent proposer,
            l&apos;élève choisit.
          </p>
        )
      ) : null}
      {n.replacement_status === "filled" ? (
        <p className="mt-2 text-xs font-medium text-green-700">
          Remplacement confirmé — cours replanifié au même horaire.
        </p>
      ) : null}

      <ReplacementNotificationActions item={item} />
    </div>
  );
}
