import { Link } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { isSiteAdminRole } from "@/features/notifications/notificationUtils";
import { useNotificationActionCount, useUnreadNotificationCount } from "./useNotifications";

interface NotificationNavBadgeProps {
  to: string;
  label?: string;
}

export function NotificationNavBadge({
  to,
  label = "Alertes campus",
}: NotificationNavBadgeProps) {
  const { data: profile } = useMyProfile();
  const { data: unreadApi = 0 } = useUnreadNotificationCount();
  const { data: actionCount = 0 } = useNotificationActionCount();

  const isAdmin = isSiteAdminRole(profile?.role);
  const count =
    profile?.role === "teacher" ||
    (profile?.role && isStudent(profile.role))
      ? actionCount
      : isAdmin
        ? Math.max(unreadApi, actionCount)
        : unreadApi;

  const hasOpenReplacements = isAdmin && actionCount > 0;

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-600 shadow-surface hover:bg-paper"
    >
      {label}
      {count > 0 ? (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
            hasOpenReplacements ? "bg-warning-bg" : "bg-paper"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
