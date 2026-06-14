import { cn } from "@gadz-connect/ui";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { useSidebarCollapsed } from "@/features/layout/sidebarCollapse";
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
  const collapsed = useSidebarCollapsed();
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

  const countBadge =
    count > 0 ? (
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
          hasOpenReplacements ? "bg-warning" : "bg-brand-600",
          collapsed && "absolute -right-1 -top-1 h-4 min-w-4 text-[9px]",
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  if (collapsed) {
    return (
      <Link
        to={to}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-surface text-ink-600 shadow-surface hover:bg-paper"
        aria-label={label}
      >
        <Bell className="h-4 w-4" />
        {countBadge}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-600 shadow-surface hover:bg-paper"
    >
      {label}
      {countBadge}
    </Link>
  );
}
