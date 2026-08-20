"use client";

import { useMutation } from "@tanstack/react-query";

import { markAllNotificationsRead } from "../services/mark-all-notifications-read";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useMarkAllNotificationsRead(organizationId: string) {
  const invalidateCaches = useInvalidateNotificationCaches();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(organizationId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, "readAll");
    },
  });
}
