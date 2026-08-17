"use client";

import { useMutation } from "@tanstack/react-query";

import {
  uploadActionItemEvidence,
  type UploadActionItemEvidenceInput,
} from "../services/upload-action-item-evidence";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useUploadActionItemEvidence(
  organizationId: string,
  occurrenceId: string,
  planId: string,
  itemId: string,
) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (input: Omit<UploadActionItemEvidenceInput, "actionItemId">) =>
      uploadActionItemEvidence({ ...input, actionItemId: itemId }),
    onSuccess: async () => {
      await invalidateCaches({ organizationId, occurrenceId, planId, itemId }, "evidence");
    },
  });
}
