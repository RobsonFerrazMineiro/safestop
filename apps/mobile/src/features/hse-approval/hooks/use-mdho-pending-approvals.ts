import { useInfiniteQuery } from "@tanstack/react-query";
import type { MdhoPendingApprovalCursor } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listMdhoPendingApprovals } from "../services/list-mdho-pending-approvals";
import { HSE_APPROVAL_QUEUE_STALE_TIME_MS, hseApprovalQueryKeys } from "../types";
import { showHseApprovalQueue } from "../utils/hse-approval-guards";

export function useMdhoPendingApprovals() {
  const { can, isPlatformAdmin } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canViewQueue = showHseApprovalQueue({
    currentUserId: "",
    isPlatformAdmin,
    permissions: {
      mdhoApprove: can("mdho.approve"),
      mdhoReturn: can("mdho.return"),
    },
  });

  const enabled = isReady && organizationId !== undefined && canViewQueue;

  const query = useInfiniteQuery({
    queryKey: hseApprovalQueryKeys.queue(organizationId ?? ""),
    queryFn: ({ pageParam }) =>
      listMdhoPendingApprovals({
        organizationId: organizationId ?? "",
        cursor: pageParam ?? null,
      }),
    initialPageParam: null as MdhoPendingApprovalCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: HSE_APPROVAL_QUEUE_STALE_TIME_MS,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    canViewQueue,
  };
}
