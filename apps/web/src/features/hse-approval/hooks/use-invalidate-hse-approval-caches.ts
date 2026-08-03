"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getOccurrenceInvalidationTargets,
  hseApprovalQueryKeys,
  resolveOccurrenceInvalidationKeys,
} from "@safestop/query-keys";

export function useInvalidateHseApprovalCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string, occurrenceId: string) => {
      const targets = getOccurrenceInvalidationTargets("hse");
      const keys = resolveOccurrenceInvalidationKeys(organizationId, occurrenceId, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}

export function useInvalidateHseApprovalQueue() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string) => {
      await queryClient.invalidateQueries({
        queryKey: hseApprovalQueryKeys.queue(organizationId),
      });
    },
    [queryClient],
  );
}
