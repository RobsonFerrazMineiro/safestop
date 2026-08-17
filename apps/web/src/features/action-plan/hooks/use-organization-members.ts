"use client";

import { useQuery } from "@tanstack/react-query";
import { actionPlanKeys } from "@safestop/query-keys";

import { getOrganizationMembers } from "../services/get-organization-members";
import { ACTION_PLAN_STALE_TIME_MS } from "../types";

export function useOrganizationMembers(organizationId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: [...actionPlanKeys.all(organizationId), "members"] as const,
    queryFn: () => getOrganizationMembers(organizationId),
    enabled: enabled && organizationId.length > 0,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  return {
    members: query.data ?? [],
    isLoading: enabled && query.isLoading,
  };
}
