import { createClient } from "@/lib/auth/client";

import type { OrganizationContractOption } from "../types";

type ContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
};

export async function getOrganizationContracts(
  organizationId: string,
): Promise<OrganizationContractOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("id, name, contract_number, contractor_organization_id")
    .eq("client_organization_id", organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os contratos.");
  }

  return ((data ?? []) as ContractRow[]).map((contract) => ({
    id: contract.id,
    name: contract.name,
    contractNumber: contract.contract_number,
    contractorOrganizationId: contract.contractor_organization_id,
  }));
}
