"use client";

import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getDashboardDistribution } from "../services/get-dashboard-distribution";
import {
  buildDashboardAccessContext,
  canAccessOccurrenceMetrics,
} from "../services/utils/dashboard-access";
import type { DashboardPeriodFilter } from "../types";

type DashboardDistributionFilters = {
  period?: DashboardPeriodFilter | null;
};

export function useDashboardDistribution(filters: DashboardDistributionFilters = {}) {
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
    organizationId.length > 0 && recipientMemberId.length > 0 && canAccessOccurrenceMetrics(access);

  const query = useQuery({
    queryKey: dashboardKeys.distribution(organizationId, filters),
    queryFn: () => getDashboardDistribution(organizationId, access, filters),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    distribution: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
