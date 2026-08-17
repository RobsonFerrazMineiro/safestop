import { getSupabaseClient } from "@/lib/auth/client";

import { assertRpcSuccess } from "@/features/evidence/utils/rpc-response";

import type { OccurrenceContractOption } from "../types";

type RpcContractRow = {
  contract_id: string;
  contract_number: string | null;
  name: string;
  contractor_organization_id: string;
  unit_id: string | null;
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

  const { data, error } = await supabase.rpc("list_organization_contracts", {
    target_organization_id: params.organizationId,
    filter_contractor_organization_id: params.contractorOrganizationId,
  });

  if (error) {
    throw new Error("Não foi possível carregar os contratos.");
  }

  const rows = assertRpcSuccess<RpcContractRow[]>(data, "Não foi possível carregar os contratos.");

  return rows.map((contract) => ({
    id: contract.contract_id,
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
