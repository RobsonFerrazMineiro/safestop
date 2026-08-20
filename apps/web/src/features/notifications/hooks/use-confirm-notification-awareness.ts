"use client";

import { useMutation } from "@tanstack/react-query";
import { isNotificationRpcConflictError, NotificationRpcConflictError } from "@safestop/types";

import { confirmNotificationAwareness } from "../services/confirm-notification-awareness";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useConfirmNotificationAwareness(organizationId: string) {
  const invalidateCaches = useInvalidateNotificationCaches();

  return useMutation({
    mutationFn: (notificationId: string) => confirmNotificationAwareness(notificationId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, "awareness");
    },
  });
}

export function isNotificationForbiddenError(error: unknown): boolean {
  return error instanceof NotificationRpcConflictError && error.conflict.code === "FORBIDDEN";
}

export { isNotificationRpcConflictError };
