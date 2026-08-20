import type { OrganizationContactScopeRow } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

type ContactRow = {
  area_id: string | null;
  unit_id: string | null;
  contract_id: string | null;
  management_department_id: string | null;
};

function mapContactScope(row: ContactRow): OrganizationContactScopeRow {
  return {
    areaId: row.area_id,
    unitId: row.unit_id,
    contractId: row.contract_id,
    managementDepartmentId: row.management_department_id,
  };
}

export async function getOperationalContactScopes(
  organizationId: string,
  organizationMemberId: string,
): Promise<OrganizationContactScopeRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organization_contacts")
    .select("area_id, unit_id, contract_id, management_department_id")
    .eq("organization_id", organizationId)
    .eq("organization_member_id", organizationMemberId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível carregar escopo operacional.");
  }

  return (data ?? []).map(mapContactScope);
}
