"use client";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getDashboardScopeOccurrences } from "../services/get-dashboard-scope-occurrences";
import {
  buildDashboardAccessContext,
  canAccessOccurrenceMetrics,
} from "../services/utils/dashboard-access";
import type { DashboardScopeFilters } from "../types/scope-filters";
import { hasActiveDashboardScopeFilters } from "../types/scope-filters";

export function useDashboardScopeOccurrences(scopeFilters: DashboardScopeFilters) {
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
    organizationId.length > 0 &&
    recipientMemberId.length > 0 &&
    canAccessOccurrenceMetrics(access) &&
    hasActiveDashboardScopeFilters(scopeFilters);

  const query = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "dashboard", "scope-occurrences"] as const,
    queryFn: () => getDashboardScopeOccurrences(organizationId),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  return {
    scopeOccurrences: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
