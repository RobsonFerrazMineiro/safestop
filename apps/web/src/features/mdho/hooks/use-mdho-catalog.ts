"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization";
import { occurrenceQueryKeys } from "@safestop/query-keys";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getMdhoCatalog } from "../services/get-mdho-catalog";
import { MDHO_CATALOG_STALE_TIME_MS } from "../types";

export function useMdhoCatalog(enabled: boolean) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const queryEnabled =
    enabled && isOrgReady && isAuthzReady && organizationId !== undefined && canRead;

  const query = useQuery({
    queryKey: occurrenceQueryKeys.mdhoCatalog(organizationId ?? ""),
    queryFn: () => getMdhoCatalog(organizationId!),
    enabled: queryEnabled,
    staleTime: MDHO_CATALOG_STALE_TIME_MS,
  });

  return {
    catalog: query.data ?? null,
    categories: query.data?.categories ?? [],
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    isReady: queryEnabled && query.isSuccess,
    refetch: query.refetch,
  };
}
