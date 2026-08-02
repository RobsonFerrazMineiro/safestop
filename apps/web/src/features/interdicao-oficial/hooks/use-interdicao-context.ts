"use client";

import { useMemo, useSyncExternalStore } from "react";
import { hasOccurrenceDecision, isInterdicaoDecisionBranch } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

import type { InterdicaoContext, InterdicaoOccurrence } from "../types";

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

export function useInterdicaoContext(occurrence: InterdicaoOccurrence | null): InterdicaoContext {
  const { can, isPlatformAdmin } = useAuthorization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return useMemo(() => {
    const status = occurrence?.status ?? null;
    const hasDecision = occurrence ? hasOccurrenceDecision(occurrence) : false;
    const canConfirmInterdiction =
      can("occurrence.confirm_interdiction") &&
      !isPlatformAdmin &&
      status === "EM_AVALIACAO" &&
      !hasDecision;
    const showSummary = occurrence ? isInterdicaoDecisionBranch(occurrence) : false;
    const shouldRenderSection = showSummary || canConfirmInterdiction;

    return {
      canConfirmInterdiction,
      showSummary,
      shouldRenderSection,
      hasDecision,
      isOffline: !isOnline,
    };
  }, [can, isPlatformAdmin, isOnline, occurrence]);
}
