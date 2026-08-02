import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOccurrenceCommentSchema } from "@safestop/validation";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { updateOccurrenceComment } from "../services/update-occurrence-comment";

export function useUpdateComment(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (params: { commentId: string; content: string }) => {
      const input = updateOccurrenceCommentSchema.parse(params);
      return updateOccurrenceComment(input);
    },
    onSuccess: async () => {
      if (organizationId) {
        await queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.timeline(organizationId, occurrenceId),
        });
      }
    },
  });

  return {
    updateComment: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
