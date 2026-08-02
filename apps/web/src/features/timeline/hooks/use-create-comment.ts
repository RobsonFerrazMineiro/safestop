"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateOccurrenceCommentInput } from "@safestop/validation";

import { createOccurrenceComment } from "../services/create-occurrence-comment";
import { useInvalidateOccurrenceTimeline } from "./use-occurrence-timeline";

export function useCreateComment(occurrenceId: string, organizationId: string) {
  const invalidateTimeline = useInvalidateOccurrenceTimeline();

  return useMutation({
    mutationFn: (input: Omit<CreateOccurrenceCommentInput, "occurrenceId">) =>
      createOccurrenceComment({ ...input, occurrenceId }),
    onSuccess: async () => {
      await invalidateTimeline(organizationId, occurrenceId);
    },
  });
}
