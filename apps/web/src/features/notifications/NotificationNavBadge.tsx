import { Link } from "react-router-dom";
import { useUnreadNotificationCount } from "./useNotifications";

interface NotificationNavBadgeProps {
  to: string;
  label?: string;
}

export function NotificationNavBadge({
  to,
  label = "Alertes campus",
}: NotificationNavBadgeProps) {
  const { data: count = 0 } = useUnreadNotificationCount();

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      {label}
      {count > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
