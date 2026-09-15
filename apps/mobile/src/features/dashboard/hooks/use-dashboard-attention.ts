import { useQuery } from "@tanstack/react-query";
import {
  canAccessActionPlanMetrics,
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  DASHBOARD_STALE_TIME_MS,
  type PermissionCode,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { dashboardAttentionQueryKey } from "@/features/dashboard/queries/dashboard-attention-query-key";
import { getActionItemsAttention } from "@/features/dashboard/services/get-action-items-attention";
import { resolveDashboardAccessContext } from "@/features/dashboard/services/resolve-dashboard-access-context";
import {
  DASHBOARD_ATTENTION_SCOPE,
  type DashboardAttentionScope,
} from "@/features/stop-work/utils/dashboard-list-params";

type UseDashboardAttentionOptions = {
  enabled?: boolean;
  scope?: DashboardAttentionScope;
};

export function useDashboardAttention(options: UseDashboardAttentionOptions = {}) {
  const { permissions, canAny, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";
  const scope = options.scope ?? DASHBOARD_ATTENTION_SCOPE.organization;
  const dueSoonDays = DASHBOARD_DUE_SOON_DAYS_DEFAULT;
  const canFetchAttention = canAny([
    "action_plan.create",
    "action_plan.manage",
    "action_plan.validate",
  ]);

  const enabled =
    (options.enabled ?? true) &&
    isOrgReady &&
    isAuthReady &&
    organizationId.length > 0 &&
    recipientMemberId.length > 0 &&
    canFetchAttention;

  const query = useQuery({
    queryKey: dashboardAttentionQueryKey(organizationId, scope, dueSoonDays),
    queryFn: async () => {
      const access = await resolveDashboardAccessContext(
        organizationId,
        recipientMemberId,
        permissions as ReadonlySet<PermissionCode>,
      );

      if (!canAccessActionPlanMetrics(access)) {
        return null;
      }

      return getActionItemsAttention(organizationId, access, {
        dueSoonDays,
        scope,
      });
    },
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnMount: "always",
  });

  return {
    attention: query.data ?? null,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
