import { useMutation } from "@tanstack/react-query";

import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

import { recordInterdicaoDecision } from "../services/record-interdicao-decision";

export function useRecordInterdicaoDecision(occurrenceId: string) {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  const mutation = useMutation({
    mutationFn: (decisionReason: string) => recordInterdicaoDecision(occurrenceId, decisionReason),
    onSuccess: async () => {
      await invalidateDomain(occurrenceId, "decision");
    },
  });

  return {
    recordDecision: mutation.mutateAsync,
    isRecording: mutation.isPending,
    error: mutation.error,
  };
}
