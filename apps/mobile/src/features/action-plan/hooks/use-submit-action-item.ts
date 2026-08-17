import { useMutation } from "@tanstack/react-query";
import type { SubmitActionItemInput } from "@safestop/validation";

import { submitActionItem } from "../services/submit-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useSubmitActionItem(occurrenceId: string, planId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (input: SubmitActionItemInput) => submitActionItem(input),
    onSuccess: async (_data, input) => {
      await invalidateCaches("item", { occurrenceId, planId, itemId: input.itemId });
    },
  });

  return {
    submitItem: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
