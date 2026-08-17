"use client";

import { useQuery } from "@tanstack/react-query";
import { actionPlanKeys } from "@safestop/query-keys";

import { useAuthorization } from "@/features/authorization";

import { getActionPlanByOccurrence } from "../services/get-action-plan-by-occurrence";
import { ACTION_PLAN_STALE_TIME_MS } from "../types";

export function useActionPlan(organizationId: string, occurrenceId: string, enabled: boolean) {
  const { can } = useAuthorization();
  const canRead = can("occurrence.read");
  const queryEnabled = enabled && organizationId.length > 0 && occurrenceId.length > 0 && canRead;

  const query = useQuery({
    queryKey: actionPlanKeys.byOccurrence(organizationId, occurrenceId),
    queryFn: () => getActionPlanByOccurrence(organizationId, occurrenceId),
    enabled: queryEnabled,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  return {
    plan: query.data ?? null,
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
