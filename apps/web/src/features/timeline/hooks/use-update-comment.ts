"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateOccurrenceCommentInput } from "@safestop/validation";

import { updateOccurrenceComment } from "../services/update-occurrence-comment";
import { useInvalidateOccurrenceTimeline } from "./use-occurrence-timeline";

export function useUpdateComment(occurrenceId: string, organizationId: string) {
  const invalidateTimeline = useInvalidateOccurrenceTimeline();

  return useMutation({
    mutationFn: (input: UpdateOccurrenceCommentInput) => updateOccurrenceComment(input),
    onSuccess: async () => {
      await invalidateTimeline(organizationId, occurrenceId);
    },
  });
}
