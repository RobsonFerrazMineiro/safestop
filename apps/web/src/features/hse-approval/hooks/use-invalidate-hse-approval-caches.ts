"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useInvalidateMdhoCaches } from "@/features/mdho/hooks/use-invalidate-mdho-caches";

import { hseApprovalQueryKeys } from "../types";

export function useInvalidateHseApprovalCaches() {
  const queryClient = useQueryClient();
  const invalidateMdhoCaches = useInvalidateMdhoCaches();

  return useCallback(
    async (organizationId: string, occurrenceId: string) => {
      await Promise.all([
        invalidateMdhoCaches(organizationId, occurrenceId),
        queryClient.invalidateQueries({
          queryKey: hseApprovalQueryKeys(organizationId).queuePrefix(),
        }),
      ]);
    },
    [invalidateMdhoCaches, queryClient],
  );
}

export function useInvalidateHseApprovalQueue() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string) => {
      await queryClient.invalidateQueries({
        queryKey: hseApprovalQueryKeys(organizationId).queuePrefix(),
      });
    },
    [queryClient],
  );
}
