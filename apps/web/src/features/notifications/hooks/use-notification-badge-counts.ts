"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationQueryKeys } from "@safestop/query-keys";
import { NOTIFICATION_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getNotificationBadgeCounts } from "../services/get-notification-badge-counts";
import { NOTIFICATION_POLL_INTERVAL_MS } from "../types";

export function useNotificationBadgeCounts() {
  const { can } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";
  const canRead = can("notification.read");
  const enabled = canRead && organizationId.length > 0 && recipientMemberId.length > 0;

  const query = useQuery({
    queryKey: notificationQueryKeys.unreadCount(organizationId),
    queryFn: () => getNotificationBadgeCounts(organizationId, recipientMemberId),
    enabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    pendingAwarenessCount: query.data?.pendingAwarenessCount ?? 0,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
