import { useQuery } from "@tanstack/react-query";
import { ACTION_PLAN_STALE_TIME_MS } from "@safestop/types";
import { actionPlanKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getActionPlanByOccurrence } from "../services/get-action-plan-by-occurrence";

export function useActionPlan(occurrenceId: string) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: actionPlanKeys.byOccurrence(organizationId ?? "", occurrenceId),
    queryFn: () => getActionPlanByOccurrence(organizationId!, occurrenceId),
    enabled: !!organizationId,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  return {
    plan: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
