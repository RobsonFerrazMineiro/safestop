"use client";

import { useMutation } from "@tanstack/react-query";

import { completeActionPlan } from "../services/complete-action-plan";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useCompleteActionPlan(organizationId: string, occurrenceId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (planId: string) => completeActionPlan(planId),
    onSuccess: async (_result, planId) => {
      await invalidateCaches({ organizationId, occurrenceId, planId }, "plan");
    },
  });
}
