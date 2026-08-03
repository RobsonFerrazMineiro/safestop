"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  canApproveMdhoAssessment,
  canReturnMdhoAssessment,
  showHseApprovalQueue,
  type HseApprovalContext,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useAuth } from "@/hooks/use-auth";

import type { MdhoAssessmentEnriched } from "@/features/mdho/types";

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

export function useHseApprovalContext() {
  const { can, isPlatformAdmin, isReady: isAuthzReady } = useAuthorization();
  const { user } = useAuth();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  const context = useMemo<HseApprovalContext>(
    () => ({
      currentUserId: user?.id ?? "",
      isPlatformAdmin,
      permissions: {
        mdhoApprove: can("mdho.approve"),
        mdhoReturn: can("mdho.return"),
      },
    }),
    [can, isPlatformAdmin, user?.id],
  );

  const showQueue = showHseApprovalQueue(context);

  const canApprove = useCallback(
    (assessment: Pick<MdhoAssessmentEnriched, "status" | "submittedBy">) =>
      canApproveMdhoAssessment({
        assessment,
        userId: context.currentUserId,
        permissions: context.permissions,
        isPlatformAdmin: context.isPlatformAdmin,
      }),
    [context],
  );

  const canReturn = useCallback(
    (assessment: Pick<MdhoAssessmentEnriched, "status">) =>
      canReturnMdhoAssessment({
        assessment,
        permissions: context.permissions,
        isPlatformAdmin: context.isPlatformAdmin,
      }),
    [context],
  );

  const isSelfSubmitted = useCallback(
    (assessment: Pick<MdhoAssessmentEnriched, "submittedBy">) =>
      assessment.submittedBy !== null && assessment.submittedBy === context.currentUserId,
    [context.currentUserId],
  );

  return {
    context,
    showQueue,
    canApprove,
    canReturn,
    isSelfSubmitted,
    isOffline: !isOnline,
    isReady: isAuthzReady && Boolean(user?.id),
  };
}
