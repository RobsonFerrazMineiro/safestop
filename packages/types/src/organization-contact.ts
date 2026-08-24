/**
 * Responsabilidade operacional — organization_contacts (Sprint 3.1).
 * Referência: docs/database.md §7.5; docs/decisions/NOTIFICATIONS-DECISIONS.md
 */

import type { Database } from "./database.types";

/** Valores atuais do CHECK `organization_contacts_contact_type_check` (fundação). */
export const ORGANIZATION_CONTACT_TYPES = [
  "CONTRACTOR_LEADERSHIP",
  "CONTRACT_INSPECTOR",
  "HSE_SUPERVISOR",
  "HSE_LEADERSHIP",
  "AREA_MANAGER",
  "CONTRACT_MANAGER",
  "COMPANY_RESPONSIBLE",
  "CUSTOM",
] as const;

export type OrganizationContactType = (typeof ORGANIZATION_CONTACT_TYPES)[number];

/**
 * PO-NOTIF-2 — adicionado por migration Gerenciadora (pendente DATABASE).
 * Incluído para contratos de UI; validação server-side quando CHECK estiver ativo.
 */
export const ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR =
  "MANAGING_COMPANY_SUPERVISOR" as const;

export type OrganizationContactTypeExtended =
  OrganizationContactType | typeof ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR;

export const ORGANIZATION_CONTACT_TYPE_LABELS: Record<OrganizationContactType, string> = {
  CONTRACTOR_LEADERSHIP: "Liderança da Contratada",
  CONTRACT_INSPECTOR: "Fiscal do Contrato",
  HSE_SUPERVISOR: "Supervisor HSE",
  HSE_LEADERSHIP: "Liderança HSE",
  AREA_MANAGER: "Gestor de Área",
  CONTRACT_MANAGER: "Gestor de Contrato",
  COMPANY_RESPONSIBLE: "Responsável da Empresa",
  CUSTOM: "Personalizado",
};

export type OrganizationContactRow = Database["public"]["Tables"]["organization_contacts"]["Row"];

export type OrganizationContactInsert =
  Database["public"]["Tables"]["organization_contacts"]["Insert"];

export type OrganizationContactUpdate =
  Database["public"]["Tables"]["organization_contacts"]["Update"];

/** DTO de aplicação (camelCase). */
export type OrganizationContact = {
  id: string;
  organizationId: string;
  organizationMemberId: string;
  unitId: string | null;
  areaId: string | null;
  managementDepartmentId: string | null;
  contractId: string | null;
  contactType: OrganizationContactTypeExtended;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationContactListFilters = {
  contactType?: OrganizationContactTypeExtended;
  contractId?: string;
  areaId?: string;
  unitId?: string;
  isActive?: boolean;
};

export type CreateOrganizationContactInput = {
  organizationMemberId: string;
  contactType: OrganizationContactTypeExtended;
  priority?: number;
  unitId?: string | null;
  areaId?: string | null;
  managementDepartmentId?: string | null;
  contractId?: string | null;
};

export type UpdateOrganizationContactInput = {
  id: string;
  organizationMemberId?: string;
  contactType?: OrganizationContactTypeExtended;
  priority?: number;
  unitId?: string | null;
  areaId?: string | null;
  managementDepartmentId?: string | null;
  contractId?: string | null;
  isActive?: boolean;
};

export type OrganizationContactPermissions = {
  organizationManage: boolean;
};

export type OrganizationContactGuardContext = {
  isPlatformAdmin: boolean;
  permissions: OrganizationContactPermissions;
};

export function isOrganizationContactType(value: string): value is OrganizationContactType {
  return (ORGANIZATION_CONTACT_TYPES as readonly string[]).includes(value);
}

export function isOrganizationContactTypeExtended(
  value: string,
): value is OrganizationContactTypeExtended {
  return (
    isOrganizationContactType(value) ||
    value === ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR
  );
}

export function mapOrganizationContact(row: OrganizationContactRow): OrganizationContact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationMemberId: row.organization_member_id,
    unitId: row.unit_id,
    areaId: row.area_id,
    managementDepartmentId: row.management_department_id,
    contractId: row.contract_id,
    contactType: row.contact_type as OrganizationContactTypeExtended,
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canManageOrganizationContacts(context: OrganizationContactGuardContext): boolean {
  if (context.isPlatformAdmin) {
    return true;
  }

  return context.permissions.organizationManage;
}
