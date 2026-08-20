"use client";

import { useSyncExternalStore } from "react";

import { useAuthorization } from "@/features/authorization";

function subscribeOnlineStatus(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function useNotificationContext() {
  const { can, isPlatformAdmin } = useAuthorization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return {
    canRead: can("notification.read"),
    canConfirmAwareness: can("notification.confirm_awareness") && !isPlatformAdmin,
    isOffline: !isOnline,
  };
}
