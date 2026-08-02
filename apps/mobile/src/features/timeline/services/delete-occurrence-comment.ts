import type { DeleteOccurrenceCommentResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceComment } from "./map-timeline-item";

type RpcDeleteCommentResponse = {
  success: boolean;
  comment: Parameters<typeof mapOccurrenceComment>[0];
  error?: { message?: string };
};

export async function deleteOccurrenceComment(
  commentId: string,
): Promise<DeleteOccurrenceCommentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("delete_occurrence_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    throw new Error("Não foi possível remover o comentário.");
  }

  const response = data as RpcDeleteCommentResponse;

  if (!response.success || !response.comment) {
    throw new Error(response.error?.message ?? "Não foi possível remover o comentário.");
  }

  return {
    comment: mapOccurrenceComment(response.comment),
  };
}
