import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_STALE_TIME_MS, type PermissionCode } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getMobileDashboardKpis } from "../services/get-mobile-dashboard-kpis";
import { resolveDashboardAccessContext } from "../services/resolve-dashboard-access-context";

export function useDashboardKpis() {
  const { permissions, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";
  const enabled =
    isOrgReady && isAuthReady && organizationId.length > 0 && recipientMemberId.length > 0;

  const query = useQuery({
    queryKey: dashboardKeys.kpis(organizationId, {}),
    queryFn: async () => {
      const access = await resolveDashboardAccessContext(
        organizationId,
        recipientMemberId,
        permissions as ReadonlySet<PermissionCode>,
      );

      return getMobileDashboardKpis(organizationId, access);
    },
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnMount: "always",
  });

  return {
    kpis: query.data,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
