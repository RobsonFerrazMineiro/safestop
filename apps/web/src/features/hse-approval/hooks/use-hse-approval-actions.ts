"use client";

import { useMutation } from "@tanstack/react-query";
import type { ReturnMdhoInput } from "@safestop/validation";

import { approveMdhoAssessment } from "@/features/mdho/services/approve-mdho-assessment";
import { returnMdhoAssessment } from "@/features/mdho/services/return-mdho-assessment";

import { useInvalidateHseApprovalCaches } from "./use-invalidate-hse-approval-caches";

export function useHseApproveMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateHseApprovalCaches();

  return useMutation({
    mutationFn: (assessmentId: string) => approveMdhoAssessment(assessmentId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}

export function useHseReturnMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateHseApprovalCaches();

  return useMutation({
    mutationFn: (input: ReturnMdhoInput) => returnMdhoAssessment(input),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
