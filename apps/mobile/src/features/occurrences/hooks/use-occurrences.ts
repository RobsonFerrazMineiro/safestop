import { useQuery } from "@tanstack/react-query";
import type { OccurrenceListFilters } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrences } from "../services/get-occurrences";
import { occurrenceQueryKeys } from "../types";

type UseOccurrencesOptions = {
  filters?: OccurrenceListFilters;
};

export function useOccurrences(options: UseOccurrencesOptions = {}) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");

  const query = useQuery({
    queryKey: occurrenceQueryKeys.list(organizationId ?? "", options.filters),
    queryFn: () =>
      getOccurrences({
        organizationId: organizationId!,
        filters: options.filters,
      }),
    enabled: isReady && organizationId !== undefined && canRead,
  });

  return {
    occurrences: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isReady: isReady && canRead,
    canRead,
  };
}
