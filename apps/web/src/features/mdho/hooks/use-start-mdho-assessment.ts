"use client";

import { useMutation } from "@tanstack/react-query";

import { startMdhoAssessment } from "../services/start-mdho-assessment";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useStartMdhoAssessment(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  return useMutation({
    mutationFn: () => startMdhoAssessment(occurrenceId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
