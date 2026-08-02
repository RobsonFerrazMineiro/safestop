import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOccurrenceCommentSchema } from "@safestop/validation";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { createOccurrenceComment } from "../services/create-occurrence-comment";
import { clearCommentDraft } from "../stores/comment-draft-store";

export function useCreateComment(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (content: string) => {
      const input = createOccurrenceCommentSchema.parse({ occurrenceId, content });
      return createOccurrenceComment(input);
    },
    onSuccess: async () => {
      clearCommentDraft(occurrenceId);

      if (organizationId) {
        await queryClient.invalidateQueries({
          queryKey: occurrenceQueryKeys.timeline(organizationId, occurrenceId),
        });
      }
    },
  });

  return {
    createComment: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
