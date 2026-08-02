import { useMutation } from "@tanstack/react-query";

import { startMdhoAssessment } from "../services/start-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useStartMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  const mutation = useMutation({
    mutationFn: () => startMdhoAssessment(occurrenceId),
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    startMdho: mutation.mutateAsync,
    isStarting: mutation.isPending,
    error: mutation.error,
  };
}
