import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceEvidence } from "../services/evidence-upload";
import { EVIDENCE_LIST_STALE_TIME_MS, evidenceQueryKeys } from "../types";

export function useOccurrenceEvidence(occurrenceId: string) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");

  const query = useQuery({
    queryKey: evidenceQueryKeys.list(organizationId ?? "", occurrenceId),
    queryFn: () => getOccurrenceEvidence(occurrenceId),
    enabled: isReady && organizationId !== undefined && canRead && occurrenceId.length > 0,
    staleTime: EVIDENCE_LIST_STALE_TIME_MS,
  });

  const evidence = (query.data ?? []).filter(
    (item) => item.uploadStatus === "COMPLETED" && item.attachmentType === "INITIAL_EVIDENCE",
  );

  return {
    evidence,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    canRead,
  };
}
