import type {
  CreateOrganizationContactInput,
  OrganizationContact,
  OrganizationContactListFilters,
  UpdateOrganizationContactInput,
} from "@safestop/types";

export type {
  CreateOrganizationContactInput,
  OrganizationContact,
  OrganizationContactListFilters,
  UpdateOrganizationContactInput,
};

export type OrganizationContactEnriched = OrganizationContact & {
  memberName: string | null;
  unitName: string | null;
  areaName: string | null;
  contractName: string | null;
};

export type OrganizationMemberOption = {
  id: string;
  profileId: string;
  fullName: string | null;
};

export type OrganizationUnitOption = {
  id: string;
  name: string;
};

export type OrganizationAreaOption = {
  id: string;
  name: string;
  unitId: string | null;
};

export type OrganizationContractOption = {
  id: string;
  name: string;
  contractNumber: string | null;
  contractorOrganizationId: string;
};

export const ORGANIZATION_CONTACT_STALE_TIME_MS = 30_000;

export const CONTACT_TYPES_REQUIRING_CONTRACT = [
  "CONTRACT_INSPECTOR",
  "CONTRACT_MANAGER",
  "MANAGING_COMPANY_SUPERVISOR",
] as const;
