"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getActionPlanInvalidationTargets,
  resolveActionPlanInvalidationKeys,
  type ActionPlanInvalidationScope,
} from "@safestop/query-keys";

export function useInvalidateActionPlanCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (scope: ActionPlanInvalidationScope, domain: "plan" | "item" | "evidence") => {
      const targets = getActionPlanInvalidationTargets(domain);
      const keys = resolveActionPlanInvalidationKeys(scope, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}
