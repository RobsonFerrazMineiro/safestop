"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { notificationQueryKeys } from "@safestop/query-keys";
import { NOTIFICATION_LIST_DEFAULT_LIMIT, NOTIFICATION_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

import { listMyNotifications } from "../services/list-my-notifications";

export function useNotificationsInfiniteList(organizationId: string, enabled: boolean) {
  const { can } = useAuthorization();
  const canRead = can("notification.read");
  const queryEnabled = enabled && canRead && organizationId.length > 0;

  const query = useInfiniteQuery({
    queryKey: [...notificationQueryKeys.all(organizationId), "infinite-list"] as const,
    queryFn: ({ pageParam }) =>
      listMyNotifications({
        organizationId,
        cursor: pageParam ?? null,
        limit: NOTIFICATION_LIST_DEFAULT_LIMIT,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    enabled: queryEnabled,
  };
}
