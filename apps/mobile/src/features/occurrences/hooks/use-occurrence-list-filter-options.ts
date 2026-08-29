import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getAreas } from "../services/get-areas";
import { getContractorOrganizations } from "../services/get-contractor-organizations";
import { OCCURRENCE_LIST_STALE_TIME_MS, occurrenceQueryKeys } from "../types";

const operationalFunnelContractorsQueryKey = (organizationId: string) =>
  [...occurrenceQueryKeys.contractors(organizationId), "operational-funnel"] as const;

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
    queryFn: () => getAreas({ organizationId: organizationId! }),
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  const contractorsQuery = useQuery({
    queryKey: operationalFunnelContractorsQueryKey(organizationId ?? ""),
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
