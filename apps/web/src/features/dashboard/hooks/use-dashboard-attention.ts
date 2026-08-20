"use client";

import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getActionItemsAttention } from "../services/get-action-items-attention";
import {
  buildDashboardAccessContext,
  canAccessActionPlanMetrics,
} from "../services/utils/dashboard-access";
import type { DashboardKpiFilters } from "../types";

export function useDashboardAttention(filters: Pick<DashboardKpiFilters, "dueSoonDays"> = {}) {
  const { permissions } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";

  const access = buildDashboardAccessContext({
    recipientMemberId,
    hasOrganizationContactScope: false,
    permissions,
  });
  const enabled =
    organizationId.length > 0 && recipientMemberId.length > 0 && canAccessActionPlanMetrics(access);

  const query = useQuery({
    queryKey: dashboardKeys.attention(organizationId),
    queryFn: () => getActionItemsAttention(organizationId, access, filters),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    attention: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
