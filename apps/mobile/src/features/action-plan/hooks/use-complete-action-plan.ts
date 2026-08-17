import { useMutation } from "@tanstack/react-query";

import { completeActionPlan } from "../services/complete-action-plan";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useCompleteActionPlan(occurrenceId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (planId: string) => completeActionPlan(planId),
    onSuccess: async (_data, planId) => {
      await invalidateCaches("plan", { occurrenceId, planId });
    },
  });

  return {
    completePlan: mutation.mutateAsync,
    isCompleting: mutation.isPending,
    error: mutation.error,
  };
}
