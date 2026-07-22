import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/features/auth/AuthProvider";
import { useNotifications } from "@/features/notifications/useNotifications";
import {
  dismissAlertsPopup,
  getActionableUnreadAlerts,
  wasAlertsPopupDismissed,
} from "./dashboardActionUtils";

/**
 * Modal « actions en attente » au premier affichage du jour sur le dashboard.
 * Dismiss mémorisé en sessionStorage (userId + date).
 */
export function DashboardAlertsPopup() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);

  const actionable = useMemo(
    () => getActionableUnreadAlerts(notifications),
    [notifications],
  );

  useEffect(() => {
    if (isLoading || !user?.id) return;
    if (actionable.length === 0) return;
    if (wasAlertsPopupDismissed(user.id)) return;
    setOpen(true);
  }, [isLoading, user?.id, actionable.length]);

  function handleClose() {
    if (user?.id) dismissAlertsPopup(user.id);
    setOpen(false);
  }

  const preview = actionable.slice(0, 3);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        actionable.length === 1
          ? "1 action en attente"
          : `${actionable.length} actions en attente`
      }
      description="Des alertes nécessitent votre attention."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Plus tard
          </Button>
          <Button type="button" asChild>
            <Link to="/app/alertes" onClick={handleClose}>
              Voir toutes les alertes
            </Link>
          </Button>
        </div>
      }
    >
      <ul className="space-y-2 text-sm">
        {preview.map((item) => {
          const n = item.notification;
          if (!n) return null;
          return (
            <li
              key={item.id}
              className="rounded-lg border border-line bg-paper px-3 py-2"
            >
              <p className="font-medium text-ink-900">{n.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-600">
                {n.message}
              </p>
              <Link
                to={`/app/alertes?focus=${encodeURIComponent(item.id)}`}
                className="mt-1 inline-block text-xs font-medium text-brand-700 hover:underline"
                onClick={handleClose}
              >
                Ouvrir →
              </Link>
            </li>
          );
        })}
      </ul>
      {actionable.length > 3 ? (
        <p className="mt-3 text-xs text-ink-500">
          +{actionable.length - 3} autre
          {actionable.length - 3 > 1 ? "s" : ""} dans Alertes
        </p>
      ) : null}
    </Modal>
  );
}
