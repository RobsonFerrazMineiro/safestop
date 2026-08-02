"use client";

import { useMutation } from "@tanstack/react-query";

import { approveMdhoAssessment } from "../services/approve-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useApproveMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  return useMutation({
    mutationFn: (assessmentId: string) => approveMdhoAssessment(assessmentId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
