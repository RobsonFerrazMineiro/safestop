import { useInfiniteQuery } from "@tanstack/react-query";
import { NOTIFICATION_LIST_DEFAULT_LIMIT, NOTIFICATION_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { notificationQueryKeys } from "@safestop/query-keys";

import { listMyNotifications } from "../services/list-my-notifications";

export function useMyNotifications() {
  const { can, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const canRead = can("notification.read");
  const enabled = isOrgReady && isAuthReady && organizationId.length > 0 && canRead;

  const query = useInfiniteQuery({
    queryKey: notificationQueryKeys.list(organizationId, null),
    queryFn: ({ pageParam }) =>
      listMyNotifications({
        organizationId,
        cursor: pageParam ?? null,
        limit: NOTIFICATION_LIST_DEFAULT_LIMIT,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchOnMount: "always",
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: enabled && (query.isLoading || query.isPending),
    isFetching: query.isFetching,
    isError: query.isError,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    canRead,
  };
}
