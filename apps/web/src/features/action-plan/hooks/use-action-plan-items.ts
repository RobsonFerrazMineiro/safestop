"use client";

import { useQuery } from "@tanstack/react-query";
import { actionPlanKeys } from "@safestop/query-keys";

import { useAuthorization } from "@/features/authorization";

import { getActionPlanItems } from "../services/get-action-plan-items";
import { ACTION_PLAN_STALE_TIME_MS } from "../types";

export function useActionPlanItems(
  organizationId: string,
  planId: string | undefined,
  enabled: boolean,
) {
  const { can } = useAuthorization();
  const canRead = can("occurrence.read");
  const queryEnabled =
    enabled && canRead && organizationId.length > 0 && planId !== undefined && planId.length > 0;

  const query = useQuery({
    queryKey: actionPlanKeys.items(organizationId, planId ?? ""),
    queryFn: () => getActionPlanItems(organizationId, planId!),
    enabled: queryEnabled,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  return {
    items: query.data ?? [],
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
