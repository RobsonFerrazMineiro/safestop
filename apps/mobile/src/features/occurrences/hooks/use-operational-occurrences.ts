import { useInfiniteQuery } from "@tanstack/react-query";
import type { OccurrenceListFilters, OperationalOccurrenceListCursor } from "@safestop/types";
import { OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listOperationalOccurrences } from "../services/list-operational-occurrences";
import { OCCURRENCE_LIST_STALE_TIME_MS, occurrenceQueryKeys } from "../types";

function listQueryFilters(filters: OccurrenceListFilters): OccurrenceListFilters {
  const next: OccurrenceListFilters = {
    pagination: {
      limit: filters.pagination?.limit ?? OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT,
    },
  };

  if (filters.search !== undefined) {
    next.search = filters.search;
  }

  if (filters.status !== undefined) {
    next.status = filters.status;
  }

  if (filters.severity !== undefined) {
    next.severity = filters.severity;
  }

  if (filters.areaId !== undefined) {
    next.areaId = filters.areaId;
  }

  if (filters.contractorOrganizationId !== undefined) {
    next.contractorOrganizationId = filters.contractorOrganizationId;
  }

  if (filters.imsReferenceCode !== undefined) {
    next.imsReferenceCode = filters.imsReferenceCode;
  }

  return next;
}

export function useOperationalOccurrences(
  filters: OccurrenceListFilters = {},
  options?: { enabled?: boolean },
) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    (options?.enabled ?? true) &&
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    canRead;

  const queryFilters = listQueryFilters(filters);
  const pageLimit = filters.pagination?.limit ?? OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT;

  const query = useInfiniteQuery({
    queryKey: occurrenceQueryKeys.list(organizationId ?? "", queryFilters),
    queryFn: ({ pageParam }) =>
      listOperationalOccurrences(organizationId!, {
        ...queryFilters,
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
