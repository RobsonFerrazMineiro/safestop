"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { canManageOrganizationContacts } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useNotificationBadgeCounts } from "@/features/notifications";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBadgeCount } from "@/features/notifications/utils/format-labels";
import { cn } from "@/lib/utils";

import { BrandMarkIcon, CloseIcon, MenuIcon } from "./nav-icons";
import { getNavSections, type NavItem, type NavSection } from "../utils/get-nav-items";

const HIDDEN_PATH_PREFIXES = ["/organizations", "/login"];

function useSidebarNavSections(): NavSection[] {
  const { can, isPlatformAdmin } = useAuthorization();

  const canManageContacts = canManageOrganizationContacts({
    isPlatformAdmin,
    permissions: { organizationManage: can("organization.manage") },
  });

  return getNavSections({
    canApproveMdho: can("mdho.approve") || can("mdho.return"),
    canManageContacts,
    canManageOrganization: can("organization.manage"),
    canReadReports: can("report.read"),
    canCreateOccurrence: can("occurrence.create"),
  });
}

type NavItemLinkProps = {
  item: NavItem;
  pathname: string;
  variant: "icon" | "full";
  unreadCount: number;
  onNavigate?: () => void;
};

function NavItemLink({ item, pathname, variant, unreadCount, onNavigate }: NavItemLinkProps) {
  const Icon = item.icon;
  const active = item.isActive(pathname);
  const showBadge = item.key === "notifications" && unreadCount > 0;

  const link = (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
        variant === "icon" ? "justify-center p-2.5" : "px-3 py-2",
        active
          ? "bg-[var(--surface-elevated)] font-semibold text-[var(--foreground)]"
          : "text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)]/60 hover:text-[var(--foreground)]",
      )}
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

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

type NavSectionsListProps = {
  sections: NavSection[];
  pathname: string;
  variant: "icon" | "full";
  unreadCount: number;
  onNavigate?: () => void;
};

function NavSectionsList({
  sections,
  pathname,
  variant,
  unreadCount,
  onNavigate,
}: NavSectionsListProps) {
  return (
    <div className={variant === "full" ? "flex flex-col gap-4" : "flex flex-col gap-1"}>
      {sections.map((section, index) => {
        if (section.items.length === 0) {
          return null;
        }

        return (
          <div key={section.key} className="flex flex-col">
            {variant === "icon" && index > 0 ? (
              <div aria-hidden="true" className="my-2 mx-1 border-t border-[var(--border)]/60" />
            ) : null}

            {variant === "full" ? (
              <div className="px-3 pt-2 pb-1.5 first:pt-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/60">
                  {section.label}
                </span>
              </div>
            ) : null}

            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.key}>
                  <NavItemLink
                    item={item}
                    onNavigate={onNavigate}
                    pathname={pathname}
                    unreadCount={unreadCount}
                    variant={variant}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
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

export function AppSidebar() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const sections = useSidebarNavSections();
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

            <nav aria-label="Navegação principal" className="flex-1">
              <NavSectionsList
                onNavigate={() => setIsDrawerOpen(false)}
                pathname={pathname}
                sections={sections}
                unreadCount={unreadCount}
                variant="full"
              />
            </nav>
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

        <nav aria-label="Navegação principal" className="flex-1">
          <div className="lg:hidden">
            <NavSectionsList
              pathname={pathname}
              sections={sections}
              unreadCount={unreadCount}
              variant="icon"
            />
          </div>
          <div className="hidden lg:block">
            <NavSectionsList
              pathname={pathname}
              sections={sections}
              unreadCount={unreadCount}
              variant="full"
            />
          </div>
        </nav>
      </aside>
    </>
  );
}
