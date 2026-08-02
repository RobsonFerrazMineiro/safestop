import type { UpdateOccurrenceCommentResult } from "@safestop/types";
import type { UpdateOccurrenceCommentInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceComment } from "./map-timeline-item";

type RpcUpdateCommentResponse = {
  success: boolean;
  comment: Parameters<typeof mapOccurrenceComment>[0];
  error?: { message?: string };
};

export async function updateOccurrenceComment(
  input: UpdateOccurrenceCommentInput,
): Promise<UpdateOccurrenceCommentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("update_occurrence_comment", {
    p_comment_id: input.commentId,
    p_content: input.content,
  });

  if (error) {
    throw new Error("Não foi possível salvar o comentário.");
  }

  const response = data as RpcUpdateCommentResponse;

  if (!response.success || !response.comment) {
    throw new Error(response.error?.message ?? "Não foi possível salvar o comentário.");
  }

  return {
    comment: mapOccurrenceComment(response.comment),
  };
}
