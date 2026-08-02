"use client";

import { useMutation } from "@tanstack/react-query";

import { startOccurrenceEvaluation } from "../services/start-occurrence-evaluation";
import { useInvalidateVerEAgirCaches } from "./use-invalidate-ver-e-agir-caches";

export function useStartEvaluation(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateVerEAgirCaches();

  return useMutation({
    mutationFn: () => startOccurrenceEvaluation(occurrenceId),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
