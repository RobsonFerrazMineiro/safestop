import { useQuery } from "@tanstack/react-query";
import { ACTION_PLAN_STALE_TIME_MS } from "@safestop/types";
import { actionPlanKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getActionPlanItems } from "../services/get-action-plan-items";

export function useActionPlanItems(planId: string | null) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: actionPlanKeys.items(organizationId ?? "", planId ?? ""),
    queryFn: () => getActionPlanItems(planId!),
    enabled: !!organizationId && !!planId,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
