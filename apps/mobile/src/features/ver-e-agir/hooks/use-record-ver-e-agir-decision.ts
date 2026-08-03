import { useMutation } from "@tanstack/react-query";

import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

import { recordOccurrenceDecision } from "../services/record-occurrence-decision";

export function useRecordVerEAgirDecision(occurrenceId: string) {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  const mutation = useMutation({
    mutationFn: (decisionReason: string) => recordOccurrenceDecision(occurrenceId, decisionReason),
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
