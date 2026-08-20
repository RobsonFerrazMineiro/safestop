"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { canManageOrganizationContacts } from "@safestop/types";

import { NotificationBell } from "./notification-bell";

const HIDDEN_PATH_PREFIXES = ["/organizations", "/login"];

function navLinkClass(isActive: boolean): string {
  return isActive ? "text-orange-400" : "text-gray-300 hover:text-gray-100";
}

export function AppTopBar() {
  const pathname = usePathname();
  const { can, isPlatformAdmin } = useAuthorization();
  const { activeOrganization, hasMultipleOrganizations } = useActiveOrganization();

  const hidden = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hidden) {
    return null;
  }

  const canManageContacts = canManageOrganizationContacts({
    isPlatformAdmin,
    permissions: { organizationManage: can("organization.manage") },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link className="text-sm font-semibold text-gray-100" href="/">
            SafeStop
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-3 text-sm sm:flex">
            <Link className={navLinkClass(pathname === "/")} href="/">
              Dashboard
            </Link>
            <Link className={navLinkClass(pathname.startsWith("/stop-work"))} href="/stop-work">
              Paralisações
            </Link>
            <Link className={navLinkClass(pathname === "/notifications")} href="/notifications">
              Notificações
            </Link>
            {can("mdho.approve") || can("mdho.return") ? (
              <Link
                className={navLinkClass(pathname.startsWith("/approvals"))}
                href="/approvals/mdho"
              >
                Aprovações MDHO
              </Link>
            ) : null}
            {canManageContacts ? (
              <Link
                className={navLinkClass(pathname.startsWith("/organization-contacts"))}
                href="/organization-contacts"
              >
                Responsáveis
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {activeOrganization ? (
            <span className="hidden max-w-[12rem] truncate text-xs text-gray-400 sm:inline">
              {activeOrganization.name}
            </span>
          ) : null}
          {hasMultipleOrganizations ? (
            <Link className="text-xs text-gray-400 hover:text-gray-200" href="/organizations">
              Trocar org
            </Link>
          ) : null}
          <NotificationBell />
          <Link className="text-sm text-gray-300 hover:text-white" href="/profile">
            Perfil
          </Link>
        </div>
      </div>
    </header>
  );
}
