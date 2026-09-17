import { getSupabaseClient } from "@/lib/auth/client";

import type { WorkspaceContractOption } from "../types";
import {
  isOperationalWorkspaceContractsForbidden,
  mapOperationalWorkspaceContractRows,
  mapRlsVisibleWorkspaceContractRows,
} from "../utils/operational-contract-cascade";
import { buildWorkspaceContractsQuery } from "../utils/workspace-create-rules";

type RlsVisibleContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
};

type ListOperationalWorkspaceContractsParams = {
  workspaceId: string;
  actingOrganizationId: string;
  actingOrganizationName: string | null;
};

/**
 * Fallback CONTRATADA (42501): contracts visíveis por RLS client/contractor.
 * Sem embed de organizations e sem SELECT de vínculos de outra org.
 * Lista vazia da RPC com sucesso NÃO chama isto (não inventa o WS inteiro).
 */
export async function listRlsVisibleWorkspaceContracts(params: {
  workspaceId: string;
  actingOrganizationId: string;
  actingOrganizationName: string | null;
}): Promise<WorkspaceContractOption[]> {
  const supabase = getSupabaseClient();
  const filter = buildWorkspaceContractsQuery(params.workspaceId);

  const { data, error } = await supabase
    .from("contracts")
    .select("id, name, contract_number, contractor_organization_id")
    .eq("workspace_id", filter.workspaceId)
    .eq("is_active", filter.isActive)
    .order("contract_number", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os contratos do Ambiente.");
  }

  return mapRlsVisibleWorkspaceContractRows((data ?? []) as RlsVisibleContractRow[], {
    organizationId: params.actingOrganizationId,
    organizationName: params.actingOrganizationName,
  });
}

/**
 * Gate 13X.2.5 — Create de PP: contratos operacionais via RPC 13X.2.3.
 * Não usa embed `organizations` (mapper antigo descartava o Contract).
 */
export async function listOperationalWorkspaceContracts(
  params: ListOperationalWorkspaceContractsParams,
): Promise<WorkspaceContractOption[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase.rpc("list_operational_workspace_contracts", {
    p_workspace_id: params.workspaceId,
  });

  if (error) {
    if (isOperationalWorkspaceContractsForbidden(error)) {
      return listRlsVisibleWorkspaceContracts(params);
    }

    throw new Error("Não foi possível carregar os contratos do Ambiente.");
  }

  return mapOperationalWorkspaceContractRows(data);
}
