"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Indicador persistente de offline no layout raiz autenticado (Web).
 * Decisão "Online-only" (UX-CONVERGENCE-DECISIONS.md): apenas comunica a
 * perda de conexão — nunca simula sucesso nem enfileira ações localmente.
 */
export function OfflineIndicator() {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-[var(--warning)] px-4 py-2 text-center text-sm font-medium text-[#1F1300]"
      role="status"
    >
      Você está offline. Algumas ações que dependem do servidor ficarão indisponíveis até
      reconectar.
    </div>
  );
}
