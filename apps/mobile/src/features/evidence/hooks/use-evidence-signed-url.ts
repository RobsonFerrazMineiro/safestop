import { useQuery } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceAttachmentSignedUrl } from "../services/get-attachment-signed-url";
import { EVIDENCE_SIGNED_URL_STALE_TIME_MS, evidenceQueryKeys } from "../types";

export function useEvidenceSignedUrl(
  occurrenceId: string,
  attachmentId: string | null | undefined,
) {
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    isReady &&
    organizationId !== undefined &&
    occurrenceId.length > 0 &&
    attachmentId !== undefined &&
    attachmentId !== null &&
    attachmentId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: evidenceQueryKeys.signedUrl(organizationId ?? "", occurrenceId, attachmentId ?? ""),
    queryFn: () => getOccurrenceAttachmentSignedUrl(attachmentId!),
    enabled,
    staleTime: EVIDENCE_SIGNED_URL_STALE_TIME_MS,
  });

  return {
    signedUrl: query.data?.signedUrl ?? null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
