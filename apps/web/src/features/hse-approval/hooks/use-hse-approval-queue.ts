"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { MdhoPendingApprovalCursor } from "@safestop/types";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listMdhoPendingApprovals } from "../services/list-mdho-pending-approvals";
import { HSE_APPROVAL_QUEUE_STALE_TIME_MS, hseApprovalQueryKeys } from "../types";
import { useHseApprovalContext } from "./use-hse-approval-context";

export function useHseApprovalQueue() {
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { showQueue, isReady: isContextReady } = useHseApprovalContext();

  const organizationId = activeOrganization?.id ?? "";
  const enabled = isOrgReady && isContextReady && organizationId.length > 0 && showQueue;

  const query = useInfiniteQuery({
    queryKey: hseApprovalQueryKeys(organizationId).queue(),
    queryFn: ({ pageParam }) =>
      listMdhoPendingApprovals(organizationId, pageParam as MdhoPendingApprovalCursor | null),
    initialPageParam: null as MdhoPendingApprovalCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: HSE_APPROVAL_QUEUE_STALE_TIME_MS,
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
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    organizationId,
    showQueue,
    enabled,
  };
}
