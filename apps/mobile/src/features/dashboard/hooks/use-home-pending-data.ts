import { useCallback, useEffect, useState } from "react";

import { useNotificationBadgeCounts } from "@/features/notifications";

import { useDashboardKpis } from "./use-dashboard-kpis";

function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      navigator?: { onLine?: boolean };
    };

    return browserGlobal.navigator?.onLine !== false;
  });

  useEffect(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    browserGlobal.addEventListener?.("online", handleOnline);
    browserGlobal.addEventListener?.("offline", handleOffline);

    return () => {
      browserGlobal.removeEventListener?.("online", handleOnline);
      browserGlobal.removeEventListener?.("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useHomePendingData() {
  const isOnline = useIsOnline();
  const { kpis, isLoading, isError, refetch, enabled, isFetching } = useDashboardKpis();
  const {
    pendingAwarenessCount,
    refetch: refetchAwareness,
    canRead: canReadNotifications,
    isLoading: isAwarenessLoading,
  } = useNotificationBadgeCounts();

  const hasCachedData = kpis !== undefined;

  const refresh = useCallback(async () => {
    await Promise.all([refetch(), refetchAwareness()]);
  }, [refetch, refetchAwareness]);

  return {
    myPendingActions: kpis?.personal.myPendingActions,
    myOverdueActions: kpis?.personal.myOverdueActions,
    myPendingAwareness: canReadNotifications ? pendingAwarenessCount : undefined,
    activeOccurrences: kpis?.managerial.activeOccurrences,
    isLoading: enabled && isLoading,
    isAwarenessLoading: canReadNotifications && isAwarenessLoading,
    isFetching: isFetching || isAwarenessLoading,
    isError,
    isOnline,
    hasCachedData,
    refresh,
    enabled,
    canReadNotifications,
  };
}
