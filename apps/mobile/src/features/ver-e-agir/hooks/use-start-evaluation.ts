import { useMutation, useQueryClient } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { startOccurrenceEvaluation } from "../services/start-occurrence-evaluation";

export function useStartEvaluation(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: () => startOccurrenceEvaluation(occurrenceId),
    onSuccess: async () => {
      if (!organizationId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.detail(organizationId, occurrenceId),
        }),
        queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.lists(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.timeline(organizationId, occurrenceId),
        }),
        queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.decision(organizationId, occurrenceId),
        }),
      ]);
    },
  });

  return {
    startEvaluation: mutation.mutateAsync,
    isStarting: mutation.isPending,
    error: mutation.error,
  };
}
