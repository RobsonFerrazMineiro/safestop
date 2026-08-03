"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  canRegisterImsReference,
  canUpdateImsReference,
  shouldShowImsReferenceSection,
  type ImsReferenceGuardContext,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

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

type UseImsReferenceContextOptions = {
  hasMdhoApproved?: boolean;
};

export function useImsReferenceContext(
  occurrence: Pick<
    OccurrenceDetailsEnriched,
    | "status"
    | "decisionType"
    | "imsReferenceCode"
    | "imsReferenceRegisteredAt"
    | "imsReferenceRegisteredBy"
    | "imsReferenceRegisteredByName"
    | "imsReferenceUpdatedAt"
    | "imsReferenceUpdatedBy"
    | "imsReferenceUpdatedByName"
  >,
  options: UseImsReferenceContextOptions = {},
) {
  const { can, isPlatformAdmin } = useAuthorization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  const guardContext = useMemo<ImsReferenceGuardContext>(
    () => ({
      isPlatformAdmin,
      permissions: {
        imsRegister: can("ims_reference.register"),
        imsUpdate: can("ims_reference.update"),
      },
    }),
    [can, isPlatformAdmin],
  );

  const shouldRenderSection = shouldShowImsReferenceSection(occurrence);

  const canRegister = useCallback(
    () =>
      canRegisterImsReference({
        occurrence: {
          status: occurrence.status,
          decisionType: occurrence.decisionType,
          imsReferenceCode: occurrence.imsReferenceCode,
          hasMdhoApproved: options.hasMdhoApproved,
        },
        context: guardContext,
      }),
    [guardContext, occurrence, options.hasMdhoApproved],
  );

  const canUpdate = useCallback(
    () =>
      canUpdateImsReference({
        occurrence: {
          status: occurrence.status,
          imsReferenceCode: occurrence.imsReferenceCode,
        },
        context: guardContext,
      }),
    [guardContext, occurrence],
  );

  const canView = can("occurrence.read");

  return {
    shouldRenderSection,
    canRegister: canRegister(),
    canUpdate: canUpdate(),
    canView,
    isOffline: !isOnline,
    guardContext,
  };
}

export { shouldShowImsReferenceSection };
