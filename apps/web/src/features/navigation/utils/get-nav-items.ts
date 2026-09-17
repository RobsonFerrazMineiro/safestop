import type { ComponentType } from "react";

import {
  BellIconOutline,
  ContactsIcon,
  ContractAssignmentsIcon,
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

export type NavSectionKey = "operation" | "management" | "system";

export type NavSection = {
  key: NavSectionKey;
  label: string;
  items: NavItem[];
};

/** Lista e detalhe de ocorrência — não inclui `/stop-work/new`. */
export function isStopWorkListNavActive(pathname: string): boolean {
  return pathname.startsWith("/stop-work") && pathname !== "/stop-work/new";
}

export type NavItemsParams = {
  canApproveMdho: boolean;
  canManageContacts: boolean;
  canManageOrganization: boolean;
  canReadReports: boolean;
  canCreateOccurrence: boolean;
};

/**
 * Resolve as seções semânticas de navegação (Operação, Gestão, Sistema).
 * - Operação e Sistema são sempre exibidas.
 * - Gestão é estritamente condicional ao RBAC: se nenhuma permissão estiver ativa,
 *   a seção inteira é omitida.
 */
export function getNavSections({
  canApproveMdho,
  canManageContacts,
  canManageOrganization,
  canReadReports,
  canCreateOccurrence,
}: NavItemsParams): NavSection[] {
  const operationItems: NavItem[] = [
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
      isActive: isStopWorkListNavActive,
    },
  ];

  if (canCreateOccurrence) {
    operationItems.push({
      key: "stop-work-new",
      label: "Nova Paralisação",
      href: "/stop-work/new",
      icon: PlusCircleIcon,
      isActive: (pathname) => pathname === "/stop-work/new",
    });
  }

  const managementItems: NavItem[] = [];

  if (canApproveMdho) {
    managementItems.push({
      key: "mdho-approvals",
      label: "Aprovações MDHO",
      href: "/approvals/mdho",
      icon: MdhoApprovalIcon,
      isActive: (pathname) => pathname.startsWith("/approvals"),
    });
  }

  if (canManageContacts) {
    managementItems.push({
      key: "organization-contacts",
      label: "Responsáveis",
      href: "/organization-contacts",
      icon: ContactsIcon,
      isActive: (pathname) => pathname.startsWith("/organization-contacts"),
    });
  }

  if (canManageOrganization) {
    managementItems.push({
      key: "contract-assignments",
      label: "Responsáveis do contrato",
      href: "/contract-assignments",
      icon: ContractAssignmentsIcon,
      isActive: (pathname) => pathname.startsWith("/contract-assignments"),
    });
  }

  if (canReadReports) {
    managementItems.push({
      key: "reports",
      label: "Relatórios",
      href: "/reports",
      icon: ReportsIcon,
      isActive: (pathname) => pathname.startsWith("/reports"),
    });
  }

  const systemItems: NavItem[] = [
    {
      key: "notifications",
      label: "Notificações",
      href: "/notifications",
      icon: BellIconOutline,
      isActive: (pathname) => pathname === "/notifications",
    },
    {
      key: "profile",
      label: "Perfil",
      href: "/profile",
      icon: ProfileIcon,
      isActive: (pathname) => pathname === "/profile",
    },
  ];

  const sections: NavSection[] = [
    {
      key: "operation",
      label: "Operação",
      items: operationItems,
    },
  ];

  if (managementItems.length > 0) {
    sections.push({
      key: "management",
      label: "Gestão",
      items: managementItems,
    });
  }

  sections.push({
    key: "system",
    label: "Sistema",
    items: systemItems,
  });

  return sections;
}

/**
 * Retorna todos os itens de navegação autorizados concatenados.
 * Preserva compatibilidade e ordem semântica.
 */
export function getPrimaryNavItems(params: NavItemsParams): NavItem[] {
  return getNavSections(params).flatMap((section) => section.items);
}
