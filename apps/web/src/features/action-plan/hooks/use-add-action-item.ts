"use client";

import { useMutation } from "@tanstack/react-query";

import { addActionItem } from "../services/add-action-item";
import type { AddActionItemInput } from "../types";
import { useInvalidateActionPlanCaches } from "./use-invalidate-action-plan-caches";

export function useAddActionItem(organizationId: string, occurrenceId: string, planId: string) {
  const invalidateCaches = useInvalidateActionPlanCaches();

  return useMutation({
    mutationFn: (input: AddActionItemInput) => addActionItem(input),
    onSuccess: async (result) => {
      await invalidateCaches(
        {
          organizationId,
          occurrenceId,
          planId,
          itemId: result.itemId,
        },
        "item",
      );
    },
  });
}
