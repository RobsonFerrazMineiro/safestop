import { useQuery } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getMdhoAssessment } from "../services/get-mdho-data";

export function useMdhoAssessment(occurrenceId: string) {
  const { activeOrganization, isReady } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: occurrenceQueryKeys.mdho(organizationId ?? "", occurrenceId),
    queryFn: () =>
      getMdhoAssessment({
        occurrenceId,
        organizationId: organizationId!,
      }),
    enabled: isReady && organizationId !== undefined && occurrenceId.length > 0,
  });

  return {
    assessment: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
