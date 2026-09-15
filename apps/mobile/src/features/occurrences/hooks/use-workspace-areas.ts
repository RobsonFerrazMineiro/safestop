import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

import { getWorkspaceAreas } from "../services/get-workspace-areas";
import { occurrenceQueryKeys } from "../types";

export function useWorkspaceAreas() {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const ownerOrganizationId = activeWorkspace?.ownerOrganizationId ?? null;
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
      "areas",
      "list",
      ownerOrganizationId,
    ] as const,
    queryFn: () => getWorkspaceAreas(workspaceId!, ownerOrganizationId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    areas: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    canCreate,
  };
}
