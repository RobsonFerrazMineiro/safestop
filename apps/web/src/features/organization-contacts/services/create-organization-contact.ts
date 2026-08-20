import type { CreateOrganizationContactInput } from "@safestop/types";
import { mapOrganizationContact, type OrganizationContactRow } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { OrganizationContactEnriched } from "../types";

export async function createOrganizationContact(
  organizationId: string,
  input: CreateOrganizationContactInput,
): Promise<OrganizationContactEnriched> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organization_contacts")
    .insert({
      organization_id: organizationId,
      organization_member_id: input.organizationMemberId,
      contact_type: input.contactType,
      priority: input.priority ?? 100,
      unit_id: input.unitId ?? null,
      area_id: input.areaId ?? null,
      management_department_id: input.managementDepartmentId ?? null,
      contract_id: input.contractId ?? null,
      is_active: true,
    })
    .select(
      "id, organization_id, organization_member_id, unit_id, area_id, management_department_id, contract_id, contact_type, priority, is_active, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error("Não foi possível criar o responsável.");
  }

  const row = data as OrganizationContactRow;

  return {
    ...mapOrganizationContact(row),
    memberName: null,
    unitName: null,
    areaName: null,
    contractName: null,
  };
}
