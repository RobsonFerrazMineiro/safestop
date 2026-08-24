"use client";

import { useAuthorization } from "@/features/authorization";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function useNotificationContext() {
  const { can, isPlatformAdmin } = useAuthorization();
  const { isOffline } = useOnlineStatus();

  return {
    canRead: can("notification.read"),
    canConfirmAwareness: can("notification.confirm_awareness") && !isPlatformAdmin,
    isOffline,
  };
}
