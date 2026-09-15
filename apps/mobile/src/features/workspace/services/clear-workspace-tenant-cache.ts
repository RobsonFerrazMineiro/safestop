import type { QueryClient } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";

function isWorkspaceScopedTenantKey(
  queryKey: readonly unknown[],
  organizationId: string,
  workspaceId: string,
): boolean {
  return (
    queryKey[0] === TENANT_QUERY_KEY_PREFIX &&
    queryKey[1] === organizationId &&
    queryKey[2] === workspaceId
  );
}

/**
 * Remove apenas cache tenant-scoped do Workspace anterior.
 * Não destrói authorization, notifications nem catalogs org-wide.
 */
export function clearWorkspaceTenantCache(
  queryClient: QueryClient,
  organizationId: string,
  workspaceId: string,
): void {
  void queryClient.cancelQueries({
    predicate: (query) => isWorkspaceScopedTenantKey(query.queryKey, organizationId, workspaceId),
  });

  queryClient.removeQueries({
    predicate: (query) => isWorkspaceScopedTenantKey(query.queryKey, organizationId, workspaceId),
  });
}
