"use client";

import { useMutation } from "@tanstack/react-query";

import { startActionItem } from "../services/start-action-item";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useStartActionItem(
  organizationId: string,
  occurrenceId: string,
  planId: string,
  itemId: string,
) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: () => startActionItem(itemId),
    onSuccess: async () => {
      await invalidateCaches({ organizationId, occurrenceId, planId, itemId }, "item");
    },
  });
}
