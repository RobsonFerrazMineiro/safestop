"use client";

import { useQuery } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@safestop/query-keys";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getContractorOrganizations } from "../services/get-contractor-organizations";
import { getOrganizationAreas } from "../services/get-organization-areas";
import { OCCURRENCE_LIST_STALE_TIME_MS } from "../types";

/**
 * Opções de área/contratada do funil operacional.
 * Exige `occurrence.read` (não `occurrence.create`) para o usuário consultar a lista.
 */
export function useOccurrenceListFilterOptions(options?: { enabled?: boolean }) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    (options?.enabled ?? true) &&
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    canRead;

  const areasQuery = useQuery({
    queryKey: occurrenceQueryKeys.areas(organizationId ?? ""),
    queryFn: () => getOrganizationAreas(organizationId!),
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  const contractorsQuery = useQuery({
    queryKey: occurrenceQueryKeys.contractors(organizationId ?? ""),
    queryFn: () => getContractorOrganizations(organizationId!),
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  return {
    areas: areasQuery.data ?? [],
    contractors: contractorsQuery.data ?? [],
    isLoading: enabled && (areasQuery.isLoading || contractorsQuery.isLoading),
    isError: areasQuery.isError || contractorsQuery.isError,
  };
}
