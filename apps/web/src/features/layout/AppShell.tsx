import {
  Avatar,
  AvatarFallback,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@gadz-connect/ui";
import { ChevronLeft, ChevronRight, LogOut, MoreHorizontal, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  SidebarCollapseProvider,
  useSidebarCollapsed,
  useSidebarCollapseToggle,
} from "./sidebarCollapse";
import { AppLogo } from "./AppLogo";

const MOBILE_PRIMARY_COUNT = 4;

function navShortLabel(item: AppNavItem) {
  return item.shortLabel ?? item.label.split(" ")[0] ?? item.label;
}

function MobileBottomNav({
  nav,
  footerLabel,
  footerTo,
  onFooterClick,
}: {
  nav: readonly AppNavItem[];
  footerLabel: string;
  footerTo: string;
  onFooterClick?: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = nav.filter((item) => !item.disabled).slice(0, MOBILE_PRIMARY_COUNT);
  const secondary = nav.filter((item) => !item.disabled).slice(MOBILE_PRIMARY_COUNT);

  const logoutItem = onFooterClick ? (
    <button
      type="button"
      className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors active:bg-paper"
      onClick={() => {
        setMoreOpen(false);
        onFooterClick();
      }}
    >
      <LogOut className="h-5 w-5 shrink-0 text-ink-400" />
      {footerLabel}
    </button>
  ) : (
    <Link
      to={footerTo}
      className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors active:bg-paper"
      onClick={() => setMoreOpen(false)}
    >
      <LogOut className="h-5 w-5 shrink-0 text-ink-400" />
      {footerLabel}
    </Link>
  );

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe md:hidden"
      >
        <div className="grid grid-cols-5 gap-0.5 px-1 pt-1">
          {primary.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors active:bg-paper",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-500",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      {Icon ? (
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-brand-700" : "text-ink-400",
                          )}
                        />
                      ) : null}
                      {item.badge ? (
                        <span className="absolute -right-2 -top-1 rounded-full bg-brand-600 px-1 text-[9px] font-semibold leading-tight text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="max-w-full truncate">{navShortLabel(item)}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {secondary.length > 0 ? (
            <button
              type="button"
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium text-ink-500 transition-colors active:bg-paper"
              onClick={() => setMoreOpen(true)}
              aria-label="Plus de navigation"
            >
              <MoreHorizontal className="h-5 w-5 text-ink-400" />
              <span>Plus</span>
            </button>
          ) : (
            <div className="flex min-h-12 flex-col items-center justify-center">
              {onFooterClick ? (
                <button
                  type="button"
                  className="flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium text-ink-500 active:bg-paper"
                  onClick={onFooterClick}
                  aria-label={footerLabel}
                >
                  <LogOut className="h-5 w-5 text-ink-400" />
                  <span className="max-w-full truncate">Quitter</span>
                </button>
              ) : (
                <Link
                  to={footerTo}
                  className="flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium text-ink-500 active:bg-paper"
                  aria-label={footerLabel}
                >
                  <LogOut className="h-5 w-5 text-ink-400" />
                  <span className="max-w-full truncate">Quitter</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>

      {secondary.length > 0 ? (
        <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
          <DialogContent className="fixed inset-x-0 bottom-0 left-0 top-auto max-h-[75vh] max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-xl border-b-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
            <div className="flex justify-center pt-3 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>
            <DialogHeader className="px-5 pb-2">
              <DialogTitle>Navigation</DialogTitle>
            </DialogHeader>
            <div className="max-h-[55vh] space-y-1 overflow-y-auto px-3 pb-safe -webkit-overflow-scrolling-touch">
              {secondary.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-12 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors active:bg-paper",
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-600",
                      )
                    }
                    onClick={() => setMoreOpen(false)}
                  >
                    {Icon ? (
                      <Icon className="h-5 w-5 shrink-0 text-ink-400" />
                    ) : null}
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
              <div className="border-t border-line px-2 pt-2 pb-2">
                {logoutItem}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export type AppSpaceVariant = "student" | "teacher" | "admin";

export interface AppNavItem {
  to: string;
  label: string;
  /** Libellé court pour la bottom nav mobile */
  shortLabel?: string;
  /** Badge optionnel (ex. progression 2/6) */
  badge?: string;
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
  const location = useLocation();
  const space = spaceVariant ? SPACE_STYLES[spaceVariant] : null;
  const hideMobileNav = location.pathname === "/app/setup";

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
          "flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-in-out",
          hideMobileNav ? "pb-0" : "pb-safe-nav md:pb-0",
          collapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {headerExtra && !hideMobileNav ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2 md:hidden">
            {headerExtra}
          </div>
        ) : null}

        <main className="flex-1 p-4 max-md:pb-6 md:p-8">
          <Outlet />
        </main>

        {!hideMobileNav ? (
          <MobileBottomNav
            nav={nav}
            footerLabel={footerLabel}
            footerTo={footerTo}
            onFooterClick={onFooterClick}
          />
        ) : null}
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
