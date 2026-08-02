"use client";

import { useMutation } from "@tanstack/react-query";
import type { ReturnMdhoInput } from "@safestop/validation";

import { returnMdhoAssessment } from "../services/return-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useReturnMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  return useMutation({
    mutationFn: (input: ReturnMdhoInput) => returnMdhoAssessment(input),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
