import { createClient } from "@/lib/auth/client";

import type { WorkspaceContractOption } from "../types";

type ContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/**
 * Contratos ativos do Ambiente (Gate 13X.3).
 * NÃO exige client_organization_id = EMPRESA atuante.
 */
export function buildWorkspaceContractsQuery(workspaceId: string): {
  workspaceId: string;
  isActive: true;
} {
  return {
    workspaceId,
    isActive: true,
  };
}

export async function getWorkspaceContracts(
  workspaceId: string,
): Promise<WorkspaceContractOption[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const filter = buildWorkspaceContractsQuery(workspaceId);

  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
        id,
        name,
        contract_number,
        contractor_organization_id,
        organizations!contracts_contractor_organization_id_fkey (
          id,
          name
        )
      `,
    )
    .eq("workspace_id", filter.workspaceId)
    .eq("is_active", filter.isActive)
    .order("contract_number", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os contratos do Ambiente.");
  }

  const options: WorkspaceContractOption[] = [];

  for (const row of (data ?? []) as ContractRow[]) {
    const organization = normalizeJoin(row.organizations);

    if (!organization) {
      continue;
    }

    options.push({
      id: row.id,
      name: row.name,
      contractNumber: row.contract_number,
      contractorOrganizationId: row.contractor_organization_id,
      contractorOrganizationName: organization.name,
    });
  }

  return options.sort((left, right) => {
    const leftLabel = `${left.contractNumber ?? ""} ${left.contractorOrganizationName}`;
    const rightLabel = `${right.contractNumber ?? ""} ${right.contractorOrganizationName}`;
    return leftLabel.localeCompare(rightLabel, "pt-BR");
  });
}

export function formatWorkspaceContractLabel(contract: WorkspaceContractOption): string {
  const numberPart = contract.contractNumber?.trim();
  if (numberPart) {
    return `${numberPart} — ${contract.contractorOrganizationName}`;
  }

  return `${contract.name} — ${contract.contractorOrganizationName}`;
}
