import {
  Avatar,
  AvatarFallback,
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@gadz-connect/ui";
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  SidebarCollapseProvider,
  useSidebarCollapsed,
  useSidebarCollapseToggle,
} from "./sidebarCollapse";
import { AppLogo } from "./AppLogo";

export type AppSpaceVariant = "student" | "teacher" | "admin";

export interface AppNavItem {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
}

export interface AppShellProps {
  title: string;
  subtitle: string;
  userName?: string;
  userRole?: string;
  nav: readonly AppNavItem[];
  footerLabel: string;
  footerTo?: string;
  onFooterClick?: () => void;
  headerExtra?: ReactNode;
  spaceVariant?: AppSpaceVariant;
}

const SPACE_STYLES: Record<AppSpaceVariant, { stripe: string }> = {
  student: { stripe: "bg-brand-600" },
  teacher: { stripe: "bg-accent-600" },
  admin: { stripe: "bg-brand-700" },
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return `${a}${b}`.toUpperCase() || "?";
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function SidebarTooltip({
  label,
  children,
  enabled,
}: {
  label: string;
  children: ReactNode;
  enabled: boolean;
}) {
  if (!enabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: AppNavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const itemClassName = (isActive: boolean) =>
    cn(
      "relative flex items-center rounded-md text-sm font-medium transition-colors",
      collapsed
        ? "size-10 shrink-0 justify-center"
        : "gap-2.5 px-3 py-2",
      isActive
        ? collapsed
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
          : "bg-brand-50 text-brand-700"
        : collapsed
          ? "text-ink-500 hover:bg-paper hover:text-ink-900"
          : "text-ink-600 hover:bg-paper hover:text-ink-900",
    );

  const iconClassName = (isActive: boolean) =>
    cn(
      "shrink-0",
      collapsed ? "h-5 w-5" : "h-4 w-4",
      isActive ? "text-brand-700" : collapsed ? "text-ink-500" : "text-ink-400",
    );

  const activeMarker = (isActive: boolean) =>
    isActive ? (
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-accent-600",
          collapsed ? "left-0 h-5 w-1 rounded-r-full" : "left-0 h-5 w-0.5",
        )}
        aria-hidden
      />
    ) : null;

  if (item.disabled) {
    return (
      <SidebarTooltip label={item.label} enabled={collapsed}>
        <span
          className={cn(
            "flex cursor-not-allowed items-center rounded-md text-sm font-medium text-ink-400/50",
            collapsed ? "size-10 shrink-0 justify-center" : "gap-2.5 px-3 py-2",
          )}
          aria-disabled
        >
          {Icon ? <Icon className={iconClassName(false)} /> : null}
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </span>
      </SidebarTooltip>
    );
  }

  return (
    <SidebarTooltip label={item.label} enabled={collapsed}>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => itemClassName(isActive)}
      >
        {({ isActive }) => (
          <>
            {activeMarker(isActive)}
            {Icon ? <Icon className={iconClassName(isActive)} /> : null}
            {!collapsed ? (
              <span className="truncate">{item.label}</span>
            ) : null}
          </>
        )}
      </NavLink>
    </SidebarTooltip>
  );
}

function AppShellInner({
  title,
  subtitle,
  userName,
  userRole,
  nav,
  footerLabel,
  footerTo = "/",
  onFooterClick,
  headerExtra,
  spaceVariant,
}: AppShellProps) {
  const collapsed = useSidebarCollapsed();
  const toggleSidebar = useSidebarCollapseToggle();
  const space = spaceVariant ? SPACE_STYLES[spaceVariant] : null;

  const logoutButton = onFooterClick ? (
    <Button
      variant="outline"
      size={collapsed ? "icon" : "sm"}
      className={cn(collapsed && "size-10 shrink-0", !collapsed && "w-full")}
      onClick={onFooterClick}
      aria-label={collapsed ? footerLabel : undefined}
    >
      {collapsed ? <LogOut className="h-5 w-5" /> : footerLabel}
    </Button>
  ) : (
    <Button
      variant="outline"
      size={collapsed ? "icon" : "sm"}
      className={cn(collapsed && "size-10 shrink-0", !collapsed && "w-full")}
      asChild
    >
      <Link to={footerTo} aria-label={collapsed ? footerLabel : undefined}>
        {collapsed ? <LogOut className="h-5 w-5" /> : footerLabel}
      </Link>
    </Button>
  );

  return (
    <div className="min-h-screen bg-paper">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden h-screen flex-col border-r border-line bg-surface transition-[width] duration-200 ease-in-out md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {space ? (
          <div className={cn("h-0.5 w-full shrink-0", space.stripe)} />
        ) : null}

        <div
          className={cn(
            "relative shrink-0 border-b border-line",
            collapsed ? "px-2 py-4" : "px-5 py-5",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "gap-2",
            )}
          >
            <AppLogo decorative className={collapsed ? "h-7 max-w-[2.5rem]" : undefined} />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                  Gadz&apos;Connect
                </p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <>
              <h1 className="mt-3 font-display text-lg font-semibold text-ink-900">
                {title}
              </h1>
              <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>
            </>
          ) : null}

          {toggleSidebar ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-400 shadow-surface transition-colors hover:bg-paper hover:text-ink-900"
              aria-label={
                collapsed
                  ? "Déplier la barre latérale"
                  : "Replier la barre latérale"
              }
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}
        </div>

        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
            collapsed
              ? "flex flex-col items-center gap-1 px-2 py-3"
              : "space-y-0.5 p-3",
          )}
        >
          {nav.map((item) => (
            <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {headerExtra ? (
          <div
            className={cn(
              "hidden shrink-0 border-t border-line md:flex",
              collapsed
                ? "flex-col items-center gap-1.5 px-2 py-3"
                : "flex-wrap gap-2 p-3",
            )}
          >
            {headerExtra}
          </div>
        ) : null}

        <div
          className={cn(
            "shrink-0 border-t border-line",
            collapsed ? "flex flex-col items-center px-2 py-3" : "p-4",
          )}
        >
          {userName || userRole ? (
            <div
              className={cn(
                "flex items-center",
                collapsed ? "mb-2 justify-center" : "mb-3 gap-3",
              )}
            >
              <SidebarTooltip
                label={[userName, userRole].filter(Boolean).join(" — ")}
                enabled={collapsed && Boolean(userName || userRole)}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
              </SidebarTooltip>
              {!collapsed ? (
                <div className="min-w-0">
                  {userName ? (
                    <p className="truncate text-sm font-medium text-ink-900">
                      {userName}
                    </p>
                  ) : null}
                  {userRole ? (
                    <p className="truncate text-xs text-ink-400">{userRole}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <SidebarTooltip label={footerLabel} enabled={collapsed}>
            {logoutButton}
          </SidebarTooltip>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col pb-16 transition-[padding] duration-200 ease-in-out md:pb-0",
          collapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {headerExtra ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2 md:hidden">
            {headerExtra}
          </div>
        ) : null}

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>

        <nav
          aria-label="Navigation principale"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-1 overflow-x-auto border-t border-line bg-surface p-2 md:hidden"
        >
          {nav.map((item) =>
            item.disabled ? (
              <span
                key={item.to}
                className="whitespace-nowrap rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink-400/50"
                aria-disabled
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "bg-paper text-ink-600",
                  )
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
          {onFooterClick ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              onClick={onFooterClick}
            >
              {footerLabel}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              asChild
            >
              <Link to={footerTo}>{footerLabel}</Link>
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarCollapseProvider>
      <TooltipProvider delayDuration={0}>
        <AppShellInner {...props} />
      </TooltipProvider>
    </SidebarCollapseProvider>
  );
}
