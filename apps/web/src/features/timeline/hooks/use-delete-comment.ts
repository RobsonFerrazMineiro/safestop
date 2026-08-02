"use client";

import { useMutation } from "@tanstack/react-query";

import {
  deleteOccurrenceComment,
  type DeleteOccurrenceCommentParams,
} from "../services/delete-occurrence-comment";
import { useInvalidateOccurrenceTimeline } from "./use-occurrence-timeline";

export function useDeleteComment(occurrenceId: string, organizationId: string) {
  const invalidateTimeline = useInvalidateOccurrenceTimeline();

  return useMutation({
    mutationFn: (input: DeleteOccurrenceCommentParams) => deleteOccurrenceComment(input),
    onSuccess: async () => {
      await invalidateTimeline(organizationId, occurrenceId);
    },
  });
}
