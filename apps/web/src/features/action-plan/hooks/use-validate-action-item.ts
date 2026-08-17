"use client";

import { useMutation } from "@tanstack/react-query";
import { validateActionItemSchema, type ValidateActionItemInput } from "@safestop/validation";

import { validateActionItem } from "../services/validate-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useValidateActionItem(
  organizationId: string,
  occurrenceId: string,
  planId: string,
  itemId: string,
) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (input: ValidateActionItemInput) => {
      const payload = validateActionItemSchema.parse(input);
      return validateActionItem(payload);
    },
    onSuccess: async () => {
      await invalidateCaches({ organizationId, occurrenceId, planId, itemId }, "item");
    },
  });
}
