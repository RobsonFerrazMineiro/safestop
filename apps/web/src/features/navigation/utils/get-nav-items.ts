import type { ComponentType } from "react";

import {
  BellIconOutline,
  ContactsIcon,
  DashboardIcon,
  MdhoApprovalIcon,
  PlusCircleIcon,
  ProfileIcon,
  ReportsIcon,
  StopWorkIcon,
} from "../components/nav-icons";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

type NavItemsParams = {
  canApproveMdho: boolean;
  canManageContacts: boolean;
  canReadReports: boolean;
  canCreateOccurrence: boolean;
};

/**
 * RBAC de cada item replica exatamente `app-top-bar.tsx` (linhas ~41-71) —
 * Dashboard, Paralisações, Notificações e Perfil sempre visíveis; demais
 * itens condicionados às mesmas permissões já usadas hoje. "Nova Paralisação"
 * é o único item novo, com RBAC própria (occurrence.create), conforme
 * UX-CONVERGENCE-UI-SPEC.md Seção C.
 */
export function getPrimaryNavItems({
  canApproveMdho,
  canManageContacts,
  canReadReports,
  canCreateOccurrence,
}: NavItemsParams): NavItem[] {
  const items: NavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/",
      icon: DashboardIcon,
      isActive: (pathname) => pathname === "/",
    },
    {
      key: "stop-work",
      label: "Paralisações Preventivas",
      href: "/stop-work",
      icon: StopWorkIcon,
      isActive: (pathname) => pathname.startsWith("/stop-work"),
    },
  ];

  if (canCreateOccurrence) {
    items.push({
      key: "stop-work-new",
      label: "Nova Paralisação",
      href: "/stop-work/new",
      icon: PlusCircleIcon,
      isActive: (pathname) => pathname === "/stop-work/new",
    });
  }

  if (canApproveMdho) {
    items.push({
      key: "mdho-approvals",
      label: "Aprovações MDHO",
      href: "/approvals/mdho",
      icon: MdhoApprovalIcon,
      isActive: (pathname) => pathname.startsWith("/approvals"),
    });
  }

  if (canManageContacts) {
    items.push({
      key: "organization-contacts",
      label: "Responsáveis",
      href: "/organization-contacts",
      icon: ContactsIcon,
      isActive: (pathname) => pathname.startsWith("/organization-contacts"),
    });
  }

  if (canReadReports) {
    items.push({
      key: "reports",
      label: "Relatórios",
      href: "/reports",
      icon: ReportsIcon,
      isActive: (pathname) => pathname.startsWith("/reports"),
    });
  }

  items.push({
    key: "notifications",
    label: "Notificações",
    href: "/notifications",
    icon: BellIconOutline,
    isActive: (pathname) => pathname === "/notifications",
  });

  items.push({
    key: "profile",
    label: "Perfil",
    href: "/profile",
    icon: ProfileIcon,
    isActive: (pathname) => pathname === "/profile",
  });

  return items;
}
