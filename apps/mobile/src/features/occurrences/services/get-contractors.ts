import { getSupabaseClient } from "@/lib/auth/client";

import { assertRpcSuccess } from "@/features/evidence/utils/rpc-response";

import type { OccurrenceContractorOption } from "../types";

type RpcContractorRow = {
  contractor_organization_id: string;
  contractor_name: string;
};

type GetContractorsParams = {
  organizationId: string;
};

export async function getContractors(
  params: GetContractorsParams,
): Promise<OccurrenceContractorOption[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase.rpc("list_organization_contractors", {
    target_organization_id: params.organizationId,
  });

  if (error) {
    throw new Error("Não foi possível carregar as empresas contratadas.");
  }

  const rows = assertRpcSuccess<RpcContractorRow[]>(
    data,
    "Não foi possível carregar as empresas contratadas.",
  );

  return rows
    .map((row) => ({
      id: row.contractor_organization_id,
      name: row.contractor_name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}
