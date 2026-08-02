"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isMdhoEditableStatus, isMdhoEligible } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

import type { MdhoAssessmentEnriched, MdhoContext, MdhoOccurrence } from "../types";
import { shouldShowMdhoSection } from "../types";

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

export function useMdhoContext(
  occurrence: MdhoOccurrence | null,
  assessment: MdhoAssessmentEnriched | null,
): MdhoContext {
  const { can, isPlatformAdmin } = useAuthorization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return useMemo(() => {
    if (!occurrence || !shouldShowMdhoSection(occurrence)) {
      return {
        canStartMdho: false,
        canEditMdho: false,
        canSubmitMdho: false,
        canApproveMdho: false,
        canReturnMdho: false,
        canViewMdho: false,
        shouldRenderSection: false,
        isOffline: !isOnline,
      };
    }

    const hasAssessment = assessment !== null;
    const canFill = can("mdho.fill") && !isPlatformAdmin;
    const canSubmit = can("mdho.submit") && !isPlatformAdmin;
    const canApprove = can("mdho.approve") && !isPlatformAdmin;
    const canReturn = can("mdho.return") && !isPlatformAdmin;
    const canRead = can("occurrence.read");

    const canStartMdho =
      canFill &&
      isMdhoEligible({
        status: occurrence.status,
        decisionType: occurrence.decisionType,
        hasMdhoAssessment: hasAssessment,
      });

    const assessmentStatus = assessment?.status;
    const canEditMdho =
      canFill && assessmentStatus !== undefined && isMdhoEditableStatus(assessmentStatus);
    const canSubmitMdho =
      canSubmit && assessmentStatus !== undefined && isMdhoEditableStatus(assessmentStatus);
    const canApproveMdho = canApprove && assessmentStatus === "SUBMITTED";
    const canReturnMdho = canReturn && assessmentStatus === "SUBMITTED";
    const canViewMdho =
      canRead &&
      (hasAssessment ||
        canStartMdho ||
        canEditMdho ||
        canSubmitMdho ||
        canApproveMdho ||
        canReturnMdho);

    const shouldRenderSection =
      canViewMdho &&
      (hasAssessment || canStartMdho || occurrence.status !== "INTERDICAO_CONFIRMADA" || canFill);

    return {
      canStartMdho,
      canEditMdho,
      canSubmitMdho,
      canApproveMdho,
      canReturnMdho,
      canViewMdho,
      shouldRenderSection,
      isOffline: !isOnline,
    };
  }, [assessment, can, isOnline, isPlatformAdmin, occurrence]);
}
