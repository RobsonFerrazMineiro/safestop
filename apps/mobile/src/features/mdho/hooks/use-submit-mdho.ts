import { useMutation } from "@tanstack/react-query";

import { submitMdhoAssessment } from "../services/submit-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useSubmitMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  const mutation = useMutation({
    mutationFn: submitMdhoAssessment,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    submitMdho: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
