import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getContracts } from "../services/get-contracts";
import { occurrenceQueryKeys } from "../types";

type UseOccurrenceContractsOptions = {
  contractorOrganizationId?: string;
};

export function useOccurrenceContracts(options: UseOccurrenceContractsOptions = {}) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const contractorOrganizationId = options.contractorOrganizationId?.trim();
  const canCreate = can("occurrence.create");

  const query = useQuery({
    queryKey: occurrenceQueryKeys.contracts(organizationId ?? "", contractorOrganizationId ?? ""),
    queryFn: () =>
      getContracts({
        organizationId: organizationId!,
        contractorOrganizationId: contractorOrganizationId!,
      }),
    enabled:
      isReady &&
      organizationId !== undefined &&
      canCreate &&
      contractorOrganizationId !== undefined &&
      contractorOrganizationId.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    contracts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    canCreate,
  };
}
