import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

import {
  formatWorkspaceContractLabel,
  getWorkspaceContracts,
} from "../services/get-workspace-contracts";
import { occurrenceQueryKeys } from "../types";
import { canSelectOwnTeam } from "../utils/workspace-create-rules";

export function useWorkspaceContracts() {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const canCreate = can("occurrence.create");
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    workspaceId !== undefined &&
    canCreate;

  const query = useQuery({
    queryKey: [
      ...occurrenceQueryKeys.workspaceAll(organizationId ?? "", workspaceId ?? ""),
      "contracts",
      "list",
    ] as const,
    queryFn: () => getWorkspaceContracts(workspaceId!),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const allowsOwnTeam =
    organizationId !== undefined &&
    canSelectOwnTeam({
      actingOrganizationId: organizationId,
      ownerOrganizationId: activeWorkspace?.ownerOrganizationId ?? null,
    });

  return {
    contracts: query.data ?? [],
    contractOptions: (query.data ?? []).map((contract) => ({
      id: contract.id,
      name: formatWorkspaceContractLabel(contract),
    })),
    allowsOwnTeam,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    canCreate,
  };
}
