import { useInfiniteQuery } from "@tanstack/react-query";
import { OCCURRENCE_TIMELINE_STALE_TIME_MS, type TimelineCursorPayload } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceTimeline } from "../services/get-occurrence-timeline";

export function useOccurrenceTimeline(occurrenceId: string) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled = isReady && organizationId !== undefined && canRead && occurrenceId.length > 0;

  const query = useInfiniteQuery({
    queryKey: occurrenceQueryKeys.timeline(organizationId ?? "", occurrenceId),
    queryFn: ({ pageParam }) =>
      getOccurrenceTimeline({
        occurrenceId,
        cursor: pageParam ?? null,
      }),
    initialPageParam: null as TimelineCursorPayload | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: OCCURRENCE_TIMELINE_STALE_TIME_MS,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    canRead,
  };
}
