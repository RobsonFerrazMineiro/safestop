"use client";

import { useMutation } from "@tanstack/react-query";
import { submitActionItemSchema, type SubmitActionItemInput } from "@safestop/validation";

import { submitActionItem } from "../services/submit-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useSubmitActionItem(
  organizationId: string,
  occurrenceId: string,
  planId: string,
  itemId: string,
) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (input: SubmitActionItemInput) => {
      const payload = submitActionItemSchema.parse(input);
      return submitActionItem(payload);
    },
    onSuccess: async () => {
      await invalidateCaches({ organizationId, occurrenceId, planId, itemId }, "item");
    },
  });
}
