import type { QueryClient } from "@tanstack/react-query";

import { AUTHORIZATION_QUERY_KEY } from "../types";

export function clearAuthorizationCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === AUTHORIZATION_QUERY_KEY,
  });
}
