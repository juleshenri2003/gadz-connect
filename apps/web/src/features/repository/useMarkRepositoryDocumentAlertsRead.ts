import { useEffect, useRef } from "react";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/useNotifications";

/** Marque comme lues les alertes « document de cours » quand l'élève ouvre son répertoire. */
export function useMarkRepositoryDocumentAlertsRead(enabled: boolean) {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markedRef = useRef(false);

  useEffect(() => {
    markedRef.current = false;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || markedRef.current || !notifications?.length) return;

    const unreadDocumentIds = notifications
      .filter(
        (item) =>
          !item.read_at && item.notification?.kind === "course_follow_up",
      )
      .map((item) => item.id);

    if (unreadDocumentIds.length === 0) return;

    markedRef.current = true;
    void Promise.all(
      unreadDocumentIds.map((id) => markRead.mutateAsync(id)),
    ).catch(() => {
      markedRef.current = false;
    });
  }, [enabled, markRead, notifications]);
}
