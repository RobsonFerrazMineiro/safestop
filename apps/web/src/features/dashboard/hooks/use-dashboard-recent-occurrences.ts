"use client";

import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getRecentOccurrences } from "../services/get-recent-occurrences";
import {
  buildDashboardAccessContext,
  canAccessOccurrenceMetrics,
} from "../services/utils/dashboard-access";
import type { DashboardScopeFilters } from "../types/scope-filters";

export function useDashboardRecentOccurrences(scopeFilters: DashboardScopeFilters) {
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
    queryKey: [...dashboardKeys.recentOccurrences(organizationId), scopeFilters] as const,
    queryFn: () =>
      getRecentOccurrences(organizationId, access, {
        scopeFilters,
      }),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    recentOccurrences: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
