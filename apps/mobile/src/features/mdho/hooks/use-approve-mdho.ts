import { useMutation } from "@tanstack/react-query";

import { useInvalidateHseApprovalCaches } from "@/features/hse-approval/hooks/use-invalidate-hse-approval-caches";

import { approveMdhoAssessment } from "../services/approve-mdho-assessment";

export function useApproveMdho(occurrenceId: string) {
  const invalidateCaches = useInvalidateHseApprovalCaches();

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
