import { useQuery } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceParticipants } from "../services/get-occurrence-participants";

export function useOccurrenceParticipants(occurrenceId: string) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";

  const query = useQuery({
    queryKey: ["tenant", organizationId, "occurrence-participants", occurrenceId],
    queryFn: () => getOccurrenceParticipants(occurrenceId),
    enabled: organizationId.length > 0 && occurrenceId.length > 0,
    staleTime: 60_000,
  });

  return {
    participants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
