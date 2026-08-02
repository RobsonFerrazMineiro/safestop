import { useQuery } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getMdhoCatalog } from "../services/get-mdho-data";

export function useMdhoCatalog() {
  const { activeOrganization, isReady } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: occurrenceQueryKeys.mdhoCatalog(organizationId ?? ""),
    queryFn: getMdhoCatalog,
    enabled: isReady && organizationId !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  return {
    catalog: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
