import { useMutation } from "@tanstack/react-query";
import type { CreateActionPlanInput } from "@safestop/validation";

import { createActionPlan } from "../services/create-action-plan";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useCreateActionPlan(occurrenceId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (input: CreateActionPlanInput) => createActionPlan(input),
    onSuccess: async () => {
      await invalidateCaches("plan", { occurrenceId });
    },
  });

  return {
    createPlan: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
