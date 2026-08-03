import { useMutation } from "@tanstack/react-query";

import { useInvalidateHseApprovalQueue } from "@/features/hse-approval/hooks/use-invalidate-hse-approval-caches";

import { submitMdhoAssessment } from "../services/submit-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useSubmitMdho(occurrenceId: string) {
  const invalidateMdhoCaches = useInvalidateMdhoCaches();
  const invalidateHseQueue = useInvalidateHseApprovalQueue();

  const mutation = useMutation({
    mutationFn: submitMdhoAssessment,
    onSuccess: async () => {
      await Promise.all([invalidateMdhoCaches(occurrenceId), invalidateHseQueue()]);
    },
  });

  return {
    submitMdho: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
