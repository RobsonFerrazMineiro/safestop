import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getOccurrenceInvalidationTargets,
  resolveOccurrenceInvalidationKeys,
  type OccurrenceMutationDomain,
} from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

export function useInvalidateOccurrenceDomain() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useCallback(
    async (occurrenceId: string, domain: OccurrenceMutationDomain) => {
      const organizationId = activeOrganization?.id;

      if (!organizationId) {
        return;
      }

      const targets = getOccurrenceInvalidationTargets(domain);
      const keys = resolveOccurrenceInvalidationKeys(organizationId, occurrenceId, targets);

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [activeOrganization?.id, queryClient],
  );
}
