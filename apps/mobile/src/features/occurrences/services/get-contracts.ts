import { getSupabaseClient } from "@/lib/auth/client";

import type { OccurrenceContractOption } from "../types";

type ContractRow = {
  id: string;
  contract_number: string | null;
  name: string;
};

type GetContractsParams = {
  organizationId: string;
  contractorOrganizationId: string;
};

export async function getContracts(
  params: GetContractsParams,
): Promise<OccurrenceContractOption[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number, name")
    .eq("client_organization_id", params.organizationId)
    .eq("contractor_organization_id", params.contractorOrganizationId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os contratos.");
  }

  return (data as ContractRow[]).map((contract) => ({
    id: contract.id,
    contractNumber: contract.contract_number,
    name: contract.name,
  }));
}

export function formatContractOptionLabel(contract: OccurrenceContractOption): string {
  if (contract.contractNumber && contract.name) {
    return `${contract.contractNumber} — ${contract.name}`;
  }

  return contract.contractNumber ?? contract.name;
}
