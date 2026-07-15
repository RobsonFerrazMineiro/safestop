import type { QueryClient } from "@tanstack/react-query";

import { TENANT_QUERY_KEY_PREFIX } from "../types";

export function clearTenantCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === TENANT_QUERY_KEY_PREFIX,
  });
}
