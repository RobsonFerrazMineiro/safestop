import { useQuery } from "@tanstack/react-query";
import { NOTIFICATION_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getNotificationBadgeCounts } from "../services/get-notification-badge-counts";
import { NOTIFICATION_POLL_INTERVAL_MS } from "../types";
import { notificationBadgeCountsQueryKey } from "../utils/notification-query-keys";

export function useNotificationBadgeCounts() {
  const { can, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";
  const canRead = can("notification.read");
  const enabled =
    isOrgReady &&
    isAuthReady &&
    organizationId.length > 0 &&
    recipientMemberId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: notificationBadgeCountsQueryKey(organizationId),
    queryFn: () => getNotificationBadgeCounts(organizationId, recipientMemberId),
    enabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchOnMount: "always",
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    pendingAwarenessCount: query.data?.pendingAwarenessCount ?? 0,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    canRead,
  };
}
