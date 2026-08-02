"use client";

import { useMutation } from "@tanstack/react-query";

import { recordOccurrenceDecision } from "../services/record-occurrence-decision";
import { useInvalidateVerEAgirCaches } from "./use-invalidate-ver-e-agir-caches";

type RecordDecisionVariables = {
  decisionReason: string;
};

export function useRecordVerEAgirDecision(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateVerEAgirCaches();

  return useMutation({
    mutationFn: (variables: RecordDecisionVariables) =>
      recordOccurrenceDecision({
        occurrenceId,
        decisionReason: variables.decisionReason,
      }),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
