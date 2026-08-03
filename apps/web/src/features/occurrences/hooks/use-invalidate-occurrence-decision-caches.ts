"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getOccurrenceInvalidationTargets,
  resolveOccurrenceInvalidationKeys,
} from "@safestop/query-keys";

export function useInvalidateOccurrenceDecisionCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string, occurrenceId: string) => {
      const targets = getOccurrenceInvalidationTargets("decision");
      const keys = resolveOccurrenceInvalidationKeys(organizationId, occurrenceId, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}
