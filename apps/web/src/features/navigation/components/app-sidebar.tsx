"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { canManageOrganizationContacts } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationBadgeCounts } from "@/features/notifications";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBadgeCount } from "@/features/notifications/utils/format-labels";

import { BrandMarkIcon, CloseIcon, LogOutIcon, MenuIcon } from "./nav-icons";
import { getPrimaryNavItems, type NavItem } from "../utils/get-nav-items";

const HIDDEN_PATH_PREFIXES = ["/organizations", "/login"];

function useSidebarNavItems(): NavItem[] {
  const { can, isPlatformAdmin } = useAuthorization();

  const canManageContacts = canManageOrganizationContacts({
    isPlatformAdmin,
    permissions: { organizationManage: can("organization.manage") },
  });

  return getPrimaryNavItems({
    canApproveMdho: can("mdho.approve") || can("mdho.return"),
    canManageContacts,
    canReadReports: can("report.read"),
    canCreateOccurrence: can("occurrence.create"),
  });
}

type NavListProps = {
  items: NavItem[];
  pathname: string;
  variant: "icon" | "full";
  unreadCount: number;
  onNavigate?: () => void;
};

function NavList({ items, pathname, variant, unreadCount, onNavigate }: NavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);
        const showBadge = item.key === "notifications" && unreadCount > 0;

        const link = (
          <Link
            className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition ${
              active
                ? "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                : "text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)]/60 hover:text-[var(--foreground)]"
            } ${variant === "icon" ? "justify-center" : ""}`}
            href={item.href}
            onClick={onNavigate}
          >
            <span className="relative shrink-0">
              <Icon className="h-5 w-5" />
              {showBadge && variant === "icon" ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--primary)]"
                />
              ) : null}
            </span>
            {variant === "full" ? (
              <span className="flex-1 truncate">{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
            {showBadge && variant === "full" ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">
                {formatBadgeCount(unreadCount)}
              </span>
            ) : null}
          </Link>
        );

        return (
          <li key={item.key}>
            {variant === "icon" ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-1 ${compact ? "justify-center" : ""}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--foreground)]">
        <BrandMarkIcon className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="text-base font-semibold text-[var(--foreground)]">SafeStop</span>
      ) : null}
    </div>
  );
}

type ActiveOrganizationBlockProps = {
  compact?: boolean;
};

function ActiveOrganizationBlock({ compact = false }: ActiveOrganizationBlockProps) {
  const { activeOrganization, hasMultipleOrganizations } = useActiveOrganization();

  if (!activeOrganization) {
    return null;
  }

  if (compact) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center self-center rounded-lg bg-[var(--surface-muted)] text-xs font-semibold text-[var(--foreground-muted)]"
        title={activeOrganization.name}
      >
        {activeOrganization.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-[var(--surface-muted)] px-3 py-2.5">
      <span className="truncate text-sm font-medium text-[var(--foreground)]">
        {activeOrganization.name}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[var(--foreground-muted)]">
          {activeOrganization.code ?? "—"}
        </span>
        {hasMultipleOrganizations ? (
          <Link
            className="shrink-0 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
            href="/organizations"
          >
            Trocar
          </Link>
        ) : null}
      </div>
    </div>
  );
}

type SignOutButtonProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

function SignOutButton({ compact = false, onNavigate }: SignOutButtonProps) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      onNavigate?.();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-elevated)]/60 hover:text-[var(--foreground)] disabled:opacity-50 ${
        compact ? "justify-center" : ""
      }`}
      disabled={isSigningOut}
      title={compact ? "Sair" : undefined}
      type="button"
      onClick={() => {
        void handleSignOut();
      }}
    >
      <LogOutIcon className="h-5 w-5 shrink-0" />
      {!compact ? <span>{isSigningOut ? "Saindo…" : "Sair"}</span> : null}
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const items = useSidebarNavItems();
  const { unreadCount } = useNotificationBadgeCounts();

  const hidden = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hidden) {
    return null;
  }

  return (
    <>
      {/* Mobile-web (<768px): barra superior com hambúrguer, sidebar recolhe em Drawer. */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
        <BrandBlock />
        <button
          aria-controls="app-sidebar-drawer"
          aria-expanded={isDrawerOpen}
          aria-label="Abrir navegação"
          className="rounded-md p-2 text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
          type="button"
          onClick={() => setIsDrawerOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            className="relative flex h-full w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-4"
            id="app-sidebar-drawer"
          >
            <div className="flex items-center justify-between">
              <BrandBlock />
              <button
                aria-label="Fechar navegação"
                className="rounded-md p-2 text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
                type="button"
                onClick={() => setIsDrawerOpen(false)}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <ActiveOrganizationBlock />

            <nav aria-label="Navegação principal" className="flex-1">
              <NavList
                items={items}
                pathname={pathname}
                unreadCount={unreadCount}
                variant="full"
                onNavigate={() => setIsDrawerOpen(false)}
              />
            </nav>

            <SignOutButton onNavigate={() => setIsDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Tablet (768-1023px): colapsada para ícones. Desktop (>=1024px): expandida fixa. */}
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col gap-6 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-3 md:flex lg:w-64 lg:p-4">
        <div className="lg:hidden">
          <BrandBlock compact />
        </div>
        <div className="hidden lg:block">
          <BrandBlock />
        </div>

        <div className="lg:hidden">
          <ActiveOrganizationBlock compact />
        </div>
        <div className="hidden lg:block">
          <ActiveOrganizationBlock />
        </div>

        <nav aria-label="Navegação principal" className="flex-1">
          <div className="lg:hidden">
            <NavList items={items} pathname={pathname} unreadCount={unreadCount} variant="icon" />
          </div>
          <div className="hidden lg:block">
            <NavList items={items} pathname={pathname} unreadCount={unreadCount} variant="full" />
          </div>
        </nav>

        <div className="lg:hidden">
          <SignOutButton compact />
        </div>
        <div className="hidden lg:block">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
