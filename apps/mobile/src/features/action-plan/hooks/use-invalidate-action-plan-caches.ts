import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getActionPlanInvalidationTargets,
  resolveActionPlanInvalidationKeys,
  type ActionPlanMutationDomain,
} from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

type InvalidateScope = {
  occurrenceId: string;
  planId?: string;
  itemId?: string;
};

export function useInvalidateActionPlanCaches() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useCallback(
    async (domain: ActionPlanMutationDomain, scope: InvalidateScope) => {
      const organizationId = activeOrganization?.id;

      if (!organizationId) {
        return;
      }

      const targets = getActionPlanInvalidationTargets(domain);
      const keys = resolveActionPlanInvalidationKeys(
        {
          organizationId,
          occurrenceId: scope.occurrenceId,
          planId: scope.planId,
          itemId: scope.itemId,
        },
        targets,
      );

      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [activeOrganization?.id, queryClient],
  );
}
