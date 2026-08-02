import { useMutation, useQueryClient } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { recordOccurrenceDecision } from "../services/record-occurrence-decision";

export function useRecordVerEAgirDecision(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (decisionReason: string) => recordOccurrenceDecision(occurrenceId, decisionReason),
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
    recordDecision: mutation.mutateAsync,
    isRecording: mutation.isPending,
    error: mutation.error,
  };
}
