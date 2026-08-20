import {
  isOrganizationContactTypeExtended,
  mapOrganizationContact,
  type OrganizationContactListFilters,
  type OrganizationContactRow,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { OrganizationContactEnriched } from "../types";

type ProfileJoin = { full_name: string | null };
type NameJoin = { name: string };

type ContactRow = OrganizationContactRow & {
  organization_members:
    | { profiles: ProfileJoin | ProfileJoin[] | null }
    | { profiles: ProfileJoin | ProfileJoin[] | null }[]
    | null;
  units: NameJoin | NameJoin[] | null;
  areas: NameJoin | NameJoin[] | null;
  contracts: NameJoin | NameJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapContactRow(row: ContactRow): OrganizationContactEnriched | null {
  if (!isOrganizationContactTypeExtended(row.contact_type)) {
    return null;
  }

  const base = mapOrganizationContact(row);
  const memberJoin = normalizeJoin(row.organization_members);
  const profile = memberJoin ? normalizeJoin(memberJoin.profiles) : null;
  const unit = normalizeJoin(row.units);
  const area = normalizeJoin(row.areas);
  const contract = normalizeJoin(row.contracts);

  return {
    ...base,
    memberName: profile?.full_name ?? null,
    unitName: unit?.name ?? null,
    areaName: area?.name ?? null,
    contractName: contract?.name ?? null,
  };
}

const CONTACT_SELECT = `
  id,
  organization_id,
  organization_member_id,
  unit_id,
  area_id,
  management_department_id,
  contract_id,
  contact_type,
  priority,
  is_active,
  created_at,
  updated_at,
  organization_members ( profiles ( full_name ) ),
  units ( name ),
  areas ( name ),
  contracts ( name )
`;

export async function listOrganizationContacts(
  organizationId: string,
  filters: OrganizationContactListFilters = {},
): Promise<OrganizationContactEnriched[]> {
  const supabase = createClient();

  let query = supabase
    .from("organization_contacts")
    .select(CONTACT_SELECT)
    .eq("organization_id", organizationId)
    .order("contact_type")
    .order("priority", { ascending: true });

  if (filters.contactType) {
    query = query.eq("contact_type", filters.contactType);
  }

  if (filters.contractId) {
    query = query.eq("contract_id", filters.contractId);
  }

  if (filters.areaId) {
    query = query.eq("area_id", filters.areaId);
  }

  if (filters.unitId) {
    query = query.eq("unit_id", filters.unitId);
  }

  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar os responsáveis.");
  }

  return (data ?? [])
    .map((row) => mapContactRow(row as unknown as ContactRow))
    .filter((item): item is OrganizationContactEnriched => item !== null);
}
