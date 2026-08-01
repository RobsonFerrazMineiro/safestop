import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { deleteOccurrenceAttachment } from "../services/delete-occurrence-evidence";
import { evidenceQueryKeys } from "../types";

export function useDeleteEvidence(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (attachmentId: string) => deleteOccurrenceAttachment(attachmentId),
    onSuccess: async (_data, attachmentId) => {
      if (!organizationId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: evidenceQueryKeys.list(organizationId, occurrenceId),
      });
      await queryClient.removeQueries({
        queryKey: evidenceQueryKeys.signedUrl(organizationId, occurrenceId, attachmentId),
      });
    },
  });

  return {
    deleteEvidence: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
