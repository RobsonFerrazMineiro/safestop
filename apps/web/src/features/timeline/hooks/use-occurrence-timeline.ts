"use client";

import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { TimelineCursorPayload } from "@safestop/types";
import { OCCURRENCE_TIMELINE_STALE_TIME_MS } from "@safestop/types";
import {
  getOccurrenceInvalidationTargets,
  occurrenceQueryKeys,
  resolveOccurrenceInvalidationKeys,
} from "@safestop/query-keys";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceTimeline } from "../services/get-occurrence-timeline";

export function useOccurrenceTimeline(occurrenceId: string, organizationId: string) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { isReady: isOrgReady } = useActiveOrganization();

  const canRead = can("occurrence.read");
  const enabled =
    isOrgReady && isAuthzReady && organizationId.length > 0 && occurrenceId.length > 0 && canRead;

  const query = useInfiniteQuery({
    queryKey: occurrenceQueryKeys.timelinePage(organizationId, occurrenceId, "initial"),
    queryFn: ({ pageParam }) =>
      getOccurrenceTimeline(occurrenceId, pageParam as TimelineCursorPayload | null),
    initialPageParam: null as TimelineCursorPayload | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: OCCURRENCE_TIMELINE_STALE_TIME_MS,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

export function useInvalidateOccurrenceTimeline() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string, occurrenceId: string) => {
      const targets = getOccurrenceInvalidationTargets("timeline");
      const keys = resolveOccurrenceInvalidationKeys(organizationId, occurrenceId, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}
