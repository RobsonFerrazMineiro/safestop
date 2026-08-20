import { useQuery } from "@tanstack/react-query";
import {
  buildDashboardAccessContext,
  canAccessOccurrenceMetrics,
  DASHBOARD_STALE_TIME_MS,
  type PermissionCode,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getRecentOccurrences } from "../services/get-recent-occurrences";

export function useDashboardRecentOccurrences() {
  const { permissions, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";

  const access = buildDashboardAccessContext({
    recipientMemberId,
    hasOrganizationContactScope: false,
    permissions: permissions as ReadonlySet<PermissionCode>,
  });

  const enabled =
    isOrgReady &&
    isAuthReady &&
    organizationId.length > 0 &&
    recipientMemberId.length > 0 &&
    canAccessOccurrenceMetrics(access);

  const query = useQuery({
    queryKey: dashboardKeys.recentOccurrences(organizationId),
    queryFn: () => getRecentOccurrences(organizationId, access),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnMount: "always",
  });

  return {
    recentOccurrences: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
