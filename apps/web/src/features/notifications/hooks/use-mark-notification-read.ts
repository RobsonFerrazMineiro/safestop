"use client";

import { useMutation } from "@tanstack/react-query";

import { markNotificationRead } from "../services/mark-notification-read";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useMarkNotificationRead(organizationId: string) {
  const invalidateCaches = useInvalidateNotificationCaches();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, "read");
    },
  });
}
