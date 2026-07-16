import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrence } from "../services/get-occurrence";
import { occurrenceQueryKeys } from "../types";

export function useOccurrence(occurrenceId: string) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");

  const query = useQuery({
    queryKey: occurrenceQueryKeys.detail(organizationId ?? "", occurrenceId),
    queryFn: () =>
      getOccurrence({
        occurrenceId,
        organizationId: organizationId!,
      }),
    enabled: isReady && organizationId !== undefined && occurrenceId.length > 0 && canRead,
  });

  return {
    occurrence: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isNotFound: query.isSuccess && query.data === null,
    refetch: query.refetch,
    isReady: isReady && canRead,
    canRead,
  };
}
