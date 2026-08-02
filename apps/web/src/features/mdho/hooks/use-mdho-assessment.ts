"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization";
import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getMdhoAssessment } from "../services/get-mdho-assessment";
import { MDHO_ASSESSMENT_STALE_TIME_MS } from "../types";

export function useMdhoAssessment(occurrenceId: string | undefined, enabled: boolean) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const queryEnabled =
    enabled &&
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    occurrenceId !== undefined &&
    occurrenceId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: occurrenceQueryKeys(organizationId ?? "").mdho(occurrenceId ?? ""),
    queryFn: () => getMdhoAssessment(organizationId!, occurrenceId!),
    enabled: queryEnabled,
    staleTime: MDHO_ASSESSMENT_STALE_TIME_MS,
  });

  return {
    assessment: query.data ?? null,
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    isReady: queryEnabled && query.isSuccess,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
