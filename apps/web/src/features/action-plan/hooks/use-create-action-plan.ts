"use client";

import { useMutation } from "@tanstack/react-query";
import { createActionPlanSchema, type CreateActionPlanInput } from "@safestop/validation";

import { createActionPlan } from "../services/create-action-plan";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useCreateActionPlan(organizationId: string, occurrenceId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (input: CreateActionPlanInput) => {
      const payload = createActionPlanSchema.parse(input);
      return createActionPlan(payload);
    },
    onSuccess: async (result) => {
      await invalidateCaches({ organizationId, occurrenceId, planId: result.plan.id }, "plan");
    },
  });
}
