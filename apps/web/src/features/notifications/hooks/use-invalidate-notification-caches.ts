"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getNotificationInvalidationTargets,
  resolveNotificationInvalidationKeys,
  type NotificationMutationDomain,
} from "@safestop/query-keys";

export function useInvalidateNotificationCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string, domain: NotificationMutationDomain) => {
      const targets = getNotificationInvalidationTargets(domain);
      const keys = resolveNotificationInvalidationKeys(organizationId, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}
