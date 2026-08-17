import { useMutation } from "@tanstack/react-query";

import { addActionItem } from "../services/add-action-item";
import type { AddActionItemInput } from "../types";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useAddActionItem(occurrenceId: string, planId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (input: AddActionItemInput) => addActionItem(input),
    onSuccess: async () => {
      await invalidateCaches("item", { occurrenceId, planId });
    },
  });

  return {
    addItem: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
  };
}
