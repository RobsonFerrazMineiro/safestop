import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getNotificationInvalidationTargets,
  notificationQueryKeys,
  resolveNotificationInvalidationKeys,
  type NotificationMutationDomain,
} from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { notificationBadgeCountsQueryKey } from "../utils/notification-query-keys";

export function useInvalidateNotificationCaches() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useCallback(
    async (domain: NotificationMutationDomain) => {
      const organizationId = activeOrganization?.id;

      if (!organizationId) {
        return;
      }

      const targets = getNotificationInvalidationTargets(domain);
      const keys = resolveNotificationInvalidationKeys(organizationId, targets);

      await Promise.all([
        ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        queryClient.invalidateQueries({
          queryKey: notificationBadgeCountsQueryKey(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.all(organizationId),
        }),
      ]);
    },
    [activeOrganization?.id, queryClient],
  );
}
