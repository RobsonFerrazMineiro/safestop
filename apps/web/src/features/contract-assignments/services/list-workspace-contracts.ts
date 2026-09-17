import {
  formatWorkspaceContractLabel,
  getWorkspaceContracts,
} from "@/features/occurrences/services/get-workspace-contracts";
import type { WorkspaceContractOption } from "@/features/occurrences/types";

export { buildWorkspaceContractsQuery } from "@/features/occurrences/services/get-workspace-contracts";

/**
 * Contratos do Ambiente ativo. Filtro: workspace_id.
 * Sem client_organization_id = EMPRESA.
 */
export async function listWorkspaceContractsForAssignments(
  workspaceId: string,
): Promise<WorkspaceContractOption[]> {
  return getWorkspaceContracts(workspaceId);
}

export { formatWorkspaceContractLabel };
