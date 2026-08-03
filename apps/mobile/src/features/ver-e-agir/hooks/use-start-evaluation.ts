import { useMutation } from "@tanstack/react-query";

import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

import { startOccurrenceEvaluation } from "../services/start-occurrence-evaluation";

export function useStartEvaluation(occurrenceId: string) {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  const mutation = useMutation({
    mutationFn: () => startOccurrenceEvaluation(occurrenceId),
    onSuccess: async () => {
      await invalidateDomain(occurrenceId, "decision");
    },
  });

  return {
    startEvaluation: mutation.mutateAsync,
    isStarting: mutation.isPending,
    error: mutation.error,
  };
}
