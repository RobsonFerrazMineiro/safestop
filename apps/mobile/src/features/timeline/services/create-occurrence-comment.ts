import type { CreateOccurrenceCommentResult } from "@safestop/types";
import type { CreateOccurrenceCommentInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceComment } from "./map-timeline-item";

type RpcCreateCommentResponse = {
  success: boolean;
  comment: Parameters<typeof mapOccurrenceComment>[0];
  error?: { message?: string };
};

export async function createOccurrenceComment(
  input: CreateOccurrenceCommentInput,
): Promise<CreateOccurrenceCommentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("create_occurrence_comment", {
    p_occurrence_id: input.occurrenceId,
    p_content: input.content,
  });

  if (error) {
    throw new Error("Não foi possível enviar o comentário.");
  }

  const response = data as RpcCreateCommentResponse;

  if (!response.success || !response.comment) {
    throw new Error(response.error?.message ?? "Não foi possível enviar o comentário.");
  }

  return {
    comment: mapOccurrenceComment(response.comment),
  };
}
