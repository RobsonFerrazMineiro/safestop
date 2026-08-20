"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationQueryKeys } from "@safestop/query-keys";
import { NOTIFICATION_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

import { listMyNotifications } from "../services/list-my-notifications";
import { NOTIFICATION_POPOVER_LIMIT } from "../types";

export function useNotificationPopoverList(organizationId: string, enabled: boolean) {
  const { can } = useAuthorization();
  const canRead = can("notification.read");
  const queryEnabled = enabled && canRead && organizationId.length > 0;

  const query = useQuery({
    queryKey: [...notificationQueryKeys.all(organizationId), "popover"] as const,
    queryFn: () =>
      listMyNotifications({
        organizationId,
        limit: NOTIFICATION_POPOVER_LIMIT,
      }),
    enabled: queryEnabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    items: query.data?.items ?? [],
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled: queryEnabled,
  };
}
