"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";

export function useInvalidateImsReferenceCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string, occurrenceId: string) => {
      const keys = occurrenceQueryKeys(organizationId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.detail(occurrenceId) }),
        queryClient.invalidateQueries({ queryKey: keys.lists() }),
        queryClient.invalidateQueries({ queryKey: keys.timelinePrefix(occurrenceId) }),
        queryClient.invalidateQueries({ queryKey: keys.statusHistory(occurrenceId) }),
      ]);
    },
    [queryClient],
  );
}
