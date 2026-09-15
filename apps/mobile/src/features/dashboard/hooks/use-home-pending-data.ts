import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardMetricKey } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useNotificationBadgeCounts } from "@/features/notifications";

import { useDashboardKpis } from "./use-dashboard-kpis";
import { useDashboardRecentOccurrences } from "./use-dashboard-recent-occurrences";
import { hasMetricPermission } from "../utils/kpi-config";
import { selectOperationalKpiKeys } from "../utils/select-operational-kpis";

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
  const { can, canAny } = useAuthorization();
  const { kpis, isLoading, isError, refetch, enabled, isFetching } = useDashboardKpis();
  const {
    pendingAwarenessCount,
    refetch: refetchAwareness,
    canRead: canReadNotifications,
    isLoading: isAwarenessLoading,
  } = useNotificationBadgeCounts();
  const {
    recentOccurrences,
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
    enabled: recentEnabled,
  } = useDashboardRecentOccurrences();

  const hasCachedData = kpis !== undefined;

  const operationalMetricKeys = useMemo(
    () =>
      selectOperationalKpiKeys(kpis, (key: DashboardMetricKey) =>
        hasMetricPermission(can, canAny, key),
      ),
    [can, canAny, kpis],
  );

  const refresh = useCallback(async () => {
    await Promise.all([refetch(), refetchAwareness(), refetchRecent()]);
  }, [refetch, refetchAwareness, refetchRecent]);

  return {
    kpis,
    myPendingActions: kpis?.personal.myPendingActions,
    myOverdueActions: kpis?.personal.myOverdueActions,
    myDueSoonActions: kpis?.personal.myDueSoonActions,
    myPendingAwareness: canReadNotifications ? pendingAwarenessCount : undefined,
    operationalMetricKeys,
    recentOccurrences,
    isLoading: enabled && isLoading,
    isRecentLoading: recentEnabled && isRecentLoading,
    isRecentError,
    recentEnabled,
    isAwarenessLoading: canReadNotifications && isAwarenessLoading,
    isFetching: isFetching || isAwarenessLoading || isRecentLoading,
    isError,
    isOnline,
    hasCachedData,
    refresh,
    enabled,
    canReadNotifications,
    can,
    canAny,
  };
}
