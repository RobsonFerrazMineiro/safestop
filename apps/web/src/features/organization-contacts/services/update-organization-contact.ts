import type { UpdateOrganizationContactInput } from "@safestop/types";
import { mapOrganizationContact, type OrganizationContactRow } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { OrganizationContactEnriched } from "../types";

export async function updateOrganizationContact(
  input: UpdateOrganizationContactInput,
): Promise<OrganizationContactEnriched> {
  const supabase = createClient();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.organizationMemberId !== undefined) {
    payload.organization_member_id = input.organizationMemberId;
  }

  if (input.contactType !== undefined) {
    payload.contact_type = input.contactType;
  }

  if (input.priority !== undefined) {
    payload.priority = input.priority;
  }

  if (input.unitId !== undefined) {
    payload.unit_id = input.unitId;
  }

  if (input.areaId !== undefined) {
    payload.area_id = input.areaId;
  }

  if (input.managementDepartmentId !== undefined) {
    payload.management_department_id = input.managementDepartmentId;
  }

  if (input.contractId !== undefined) {
    payload.contract_id = input.contractId;
  }

  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("organization_contacts")
    .update(payload)
    .eq("id", input.id)
    .select(
      "id, organization_id, organization_member_id, unit_id, area_id, management_department_id, contract_id, contact_type, priority, is_active, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error("Não foi possível atualizar o responsável.");
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
