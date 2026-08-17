import { useMutation } from "@tanstack/react-query";
import type { ValidateActionItemInput } from "@safestop/validation";

import { validateActionItem } from "../services/validate-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useValidateActionItem(occurrenceId: string, planId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (input: ValidateActionItemInput) => validateActionItem(input),
    onSuccess: async (_data, input) => {
      await invalidateCaches("item", { occurrenceId, planId, itemId: input.itemId });
    },
  });

  return {
    validateItem: mutation.mutateAsync,
    isValidating: mutation.isPending,
    error: mutation.error,
  };
}
