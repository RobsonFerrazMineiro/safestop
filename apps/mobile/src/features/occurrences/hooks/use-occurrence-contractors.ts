import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getContractors } from "../services/get-contractors";
import { occurrenceQueryKeys } from "../types";

export function useOccurrenceContractors() {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canCreate = can("occurrence.create");

  const query = useQuery({
    queryKey: occurrenceQueryKeys.contractors(organizationId ?? ""),
    queryFn: () => getContractors({ organizationId: organizationId! }),
    enabled: isReady && organizationId !== undefined && canCreate,
    staleTime: 5 * 60 * 1000,
  });

  return {
    contractors: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    canCreate,
  };
}
