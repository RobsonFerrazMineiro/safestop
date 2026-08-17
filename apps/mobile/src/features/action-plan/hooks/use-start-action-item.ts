import { useMutation } from "@tanstack/react-query";

import { startActionItem } from "../services/start-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useStartActionItem(occurrenceId: string, planId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  const mutation = useMutation({
    mutationFn: (itemId: string) => startActionItem(itemId),
    onSuccess: async (_data, itemId) => {
      await invalidateCaches("item", { occurrenceId, planId, itemId });
    },
  });

  return {
    startItem: mutation.mutateAsync,
    isStarting: mutation.isPending,
    error: mutation.error,
  };
}
