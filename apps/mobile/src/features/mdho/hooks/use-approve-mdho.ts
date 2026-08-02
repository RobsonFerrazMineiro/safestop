import { useMutation } from "@tanstack/react-query";

import { approveMdhoAssessment } from "../services/approve-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useApproveMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  const mutation = useMutation({
    mutationFn: approveMdhoAssessment,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    approveMdho: mutation.mutateAsync,
    isApproving: mutation.isPending,
    error: mutation.error,
  };
}
