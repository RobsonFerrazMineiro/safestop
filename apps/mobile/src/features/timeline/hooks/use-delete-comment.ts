import { useMutation, useQueryClient } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { deleteOccurrenceComment } from "../services/delete-occurrence-comment";

export function useDeleteComment(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (commentId: string) => deleteOccurrenceComment(commentId),
    onSuccess: async () => {
      if (organizationId) {
        await queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.timeline(organizationId, occurrenceId),
        });
      }
    },
  });

  return {
    deleteComment: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
