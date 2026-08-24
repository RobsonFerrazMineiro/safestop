"use client";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { getOrganizationAreas } from "@/features/occurrences/services/get-organization-areas";
import { getContractorOrganizations } from "@/features/occurrences/services/get-contractor-organizations";
import { getOrganizationContracts } from "@/features/organization-contacts/services/get-organization-contracts";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

export function useDashboardScopeFilterOptions() {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const enabled = organizationId.length > 0;

  const areasQuery = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "dashboard", "scope-filter-areas"] as const,
    queryFn: () => getOrganizationAreas(organizationId),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  const contractsQuery = useQuery({
    queryKey: [
      TENANT_QUERY_KEY_PREFIX,
      organizationId,
      "dashboard",
      "scope-filter-contracts",
    ] as const,
    queryFn: () => getOrganizationContracts(organizationId),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  const contractorsQuery = useQuery({
    queryKey: [
      TENANT_QUERY_KEY_PREFIX,
      organizationId,
      "dashboard",
      "scope-filter-contractors",
    ] as const,
    queryFn: () => getContractorOrganizations(organizationId),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  return {
    areas: areasQuery.data ?? [],
    contracts: contractsQuery.data ?? [],
    contractors: contractorsQuery.data ?? [],
    isLoading: areasQuery.isLoading || contractsQuery.isLoading || contractorsQuery.isLoading,
    isError: areasQuery.isError || contractsQuery.isError || contractorsQuery.isError,
  };
}
