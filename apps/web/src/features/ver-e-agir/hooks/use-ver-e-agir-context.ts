"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useAuthorization } from "@/features/authorization";

import {
  hasVerEAgirDecision,
  shouldShowVerEAgirSummary,
  type VerEAgirContext,
  type VerEAgirOccurrence,
} from "../types";

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

export function useVerEAgirContext(occurrence: VerEAgirOccurrence | null): VerEAgirContext {
  const { can, isPlatformAdmin } = useAuthorization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return useMemo(() => {
    const canEvaluate = can("occurrence.evaluate") && !isPlatformAdmin;
    const canViewEvaluationContext = can("occurrence.read");
    const status = occurrence?.status ?? null;
    const hasDecision = occurrence ? hasVerEAgirDecision(occurrence) : false;

    const canStartEvaluation = canEvaluate && status === "PARALISACAO_PREVENTIVA";
    const canRecordVerEAgir = canEvaluate && status === "EM_AVALIACAO" && !hasDecision;
    const showSummary = occurrence ? shouldShowVerEAgirSummary(status!, occurrence) : false;
    const showPendingEvaluation = canStartEvaluation;
    const showEvaluationForm = canRecordVerEAgir;
    const shouldRenderSection =
      showSummary ||
      showPendingEvaluation ||
      (status === "EM_AVALIACAO" && canViewEvaluationContext && !showSummary);

    return {
      canStartEvaluation,
      canRecordVerEAgir,
      canViewEvaluationContext,
      showPendingEvaluation,
      showEvaluationForm,
      showSummary,
      shouldRenderSection,
      hasDecision,
      isOffline: !isOnline,
    };
  }, [can, isPlatformAdmin, isOnline, occurrence]);
}
