import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { hseApprovalQueryKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

export function useInvalidateHseApprovalCaches() {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  return useCallback(
    async (occurrenceId: string) => {
      await invalidateDomain(occurrenceId, "hse");
    },
    [invalidateDomain],
  );
}

export function useInvalidateHseApprovalQueue() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useCallback(async () => {
    const organizationId = activeOrganization?.id;

    if (!organizationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: hseApprovalQueryKeys.queue(organizationId),
    });
  }, [activeOrganization?.id, queryClient]);
}
