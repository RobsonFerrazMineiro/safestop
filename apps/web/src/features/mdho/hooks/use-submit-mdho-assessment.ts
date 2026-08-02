"use client";

import { useMutation } from "@tanstack/react-query";

import { submitMdhoAssessment } from "../services/submit-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useSubmitMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  return useMutation({
    mutationFn: (assessmentId: string) => submitMdhoAssessment(assessmentId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
