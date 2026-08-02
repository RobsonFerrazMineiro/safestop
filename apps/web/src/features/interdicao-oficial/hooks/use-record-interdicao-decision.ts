"use client";

import { useMutation } from "@tanstack/react-query";

import { recordInterdicaoDecision } from "../services/record-interdicao-decision";
import { useInvalidateInterdicaoCaches } from "./use-invalidate-interdicao-caches";

type RecordInterdicaoVariables = {
  decisionReason: string;
};

export function useRecordInterdicaoDecision(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateInterdicaoCaches();

  return useMutation({
    mutationFn: (variables: RecordInterdicaoVariables) =>
      recordInterdicaoDecision({
        occurrenceId,
        decisionReason: variables.decisionReason,
      }),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
