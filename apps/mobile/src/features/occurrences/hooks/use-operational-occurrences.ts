import { useInfiniteQuery } from "@tanstack/react-query";
import type { OccurrenceListFilters, OperationalOccurrenceListCursor } from "@safestop/types";
import { OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

import { listOperationalOccurrences } from "../services/list-operational-occurrences";
import { OCCURRENCE_LIST_STALE_TIME_MS, occurrenceQueryKeys } from "../types";
import {
  buildOperationalOccurrenceListQueryFilters,
  shouldEnableWorkspaceScopedOccurrenceList,
} from "../utils/operational-occurrence-list-query";

export {
  buildOperationalOccurrenceListQueryFilters,
  shouldEnableWorkspaceScopedOccurrenceList,
} from "../utils/operational-occurrence-list-query";

export function useOperationalOccurrences(
  filters: OccurrenceListFilters = {},
  options?: { enabled?: boolean },
) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const canRead = can("occurrence.read");
  const enabled = shouldEnableWorkspaceScopedOccurrenceList({
    optionEnabled: options?.enabled ?? true,
    isOrgReady,
    isAuthzReady,
    organizationId,
    workspaceId,
    canRead,
  });

  const queryFilters = buildOperationalOccurrenceListQueryFilters(filters);
  const pageLimit = filters.pagination?.limit ?? OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT;

  const query = useInfiniteQuery({
    queryKey: occurrenceQueryKeys.workspaceList(
      organizationId ?? "",
      workspaceId ?? "",
      queryFilters,
    ),
    queryFn: ({ pageParam }) =>
      listOperationalOccurrences(organizationId!, {
        ...queryFilters,
        workspaceId: workspaceId!,
        pagination: {
          cursor: pageParam,
          limit: pageLimit,
        },
      }),
    initialPageParam: null as OperationalOccurrenceListCursor | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNext || lastPage.nextCursor === null) {
        return undefined;
      }

      return lastPage.nextCursor;
    },
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  const occurrences = query.data?.pages.flatMap((page) => page.items) ?? [];
  const lastPage = query.data?.pages.at(-1);

  return {
    occurrences,
    hasNext: lastPage?.hasNext === true && lastPage.nextCursor !== null,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    isReady: enabled && query.isSuccess,
    canRead,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
