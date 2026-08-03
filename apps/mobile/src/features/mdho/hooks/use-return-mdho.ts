import { useMutation } from "@tanstack/react-query";

import { useInvalidateHseApprovalCaches } from "@/features/hse-approval/hooks/use-invalidate-hse-approval-caches";

import { returnMdhoAssessment } from "../services/return-mdho-assessment";

export function useReturnMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateHseApprovalCaches();

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
