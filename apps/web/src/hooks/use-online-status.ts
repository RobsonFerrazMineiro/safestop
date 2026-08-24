"use client";

import { useSyncExternalStore } from "react";

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

/**
 * Decisão definitiva "Online-only" (UX-CONVERGENCE-DECISIONS.md): SafeStop não
 * implementa fila/sync offline. Este hook apenas detecta a perda de conexão
 * para comunicar o estado e bloquear ações dependentes de servidor.
 */
export function useOnlineStatus(): { isOnline: boolean; isOffline: boolean } {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return { isOnline, isOffline: !isOnline };
}
