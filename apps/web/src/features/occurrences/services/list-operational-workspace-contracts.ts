import { createClient } from "@/lib/auth/client";

import type { WorkspaceContractOption } from "../types";
import {
  mapRlsVisibleWorkspaceContractRows,
  shouldFallbackToRlsVisibleWorkspaceContracts,
} from "../utils/operational-contract-cascade";
import { buildWorkspaceContractsQuery } from "./get-workspace-contracts";

type OperationalContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
  contractor_organization_name: string;
};

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

function isRlsVisibleContractRow(value: unknown): value is RlsVisibleContractRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (row.contract_number === null || typeof row.contract_number === "string") &&
    typeof row.contractor_organization_id === "string"
  );
}

function isOperationalContractRow(value: unknown): value is OperationalContractRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (row.contract_number === null || typeof row.contract_number === "string") &&
    typeof row.contractor_organization_id === "string" &&
    typeof row.contractor_organization_name === "string"
  );
}

export function mapOperationalWorkspaceContractRows(data: unknown): WorkspaceContractOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const options: WorkspaceContractOption[] = [];

  for (const item of data) {
    if (!isOperationalContractRow(item)) {
      continue;
    }

    options.push({
      id: item.id,
      name: item.name,
      contractNumber: item.contract_number,
      contractorOrganizationId: item.contractor_organization_id,
      contractorOrganizationName: item.contractor_organization_name,
    });
  }

  return options;
}

/**
 * Fallback CONTRATADA (42501): contracts visíveis por RLS client/contractor.
 * Sem embed de organizations e sem SELECT de vínculos de outra org.
 * Lista vazia da RPC com sucesso NÃO chama isto.
 */
export async function listRlsVisibleWorkspaceContracts(params: {
  workspaceId: string;
  actingOrganizationId: string;
  actingOrganizationName: string | null;
}): Promise<WorkspaceContractOption[]> {
  const supabase = createClient();
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

  const rows: RlsVisibleContractRow[] = [];
  for (const item of data ?? []) {
    if (isRlsVisibleContractRow(item)) {
      rows.push(item);
    }
  }

  return mapRlsVisibleWorkspaceContractRows(rows, {
    organizationId: params.actingOrganizationId,
    organizationName: params.actingOrganizationName,
  });
}

/**
 * Gate 13X.2.4.1 — Create de PP: RPC 13X.2.3 primeiro.
 * 42501/FORBIDDEN: fallback RLS no eixo client/contractor.
 */
export async function listOperationalWorkspaceContracts(
  params: ListOperationalWorkspaceContractsParams,
): Promise<WorkspaceContractOption[]> {
  const supabase = createClient();

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
    if (shouldFallbackToRlsVisibleWorkspaceContracts(error)) {
      return listRlsVisibleWorkspaceContracts(params);
    }

    throw new Error("Não foi possível carregar os contratos do Ambiente.");
  }

  return mapOperationalWorkspaceContractRows(data);
}
