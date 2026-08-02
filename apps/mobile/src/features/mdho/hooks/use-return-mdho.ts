import { useMutation } from "@tanstack/react-query";

import { returnMdhoAssessment } from "../services/return-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useReturnMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  const mutation = useMutation({
    mutationFn: returnMdhoAssessment,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    returnMdho: mutation.mutateAsync,
    isReturning: mutation.isPending,
    error: mutation.error,
  };
}
