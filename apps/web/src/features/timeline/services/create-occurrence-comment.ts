import type { CreateOccurrenceCommentResult } from "@safestop/types";
import type { CreateOccurrenceCommentInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcCreateCommentResponse = {
  comment: CreateOccurrenceCommentResult["comment"];
};

export async function createOccurrenceComment(
  input: CreateOccurrenceCommentInput,
): Promise<CreateOccurrenceCommentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_occurrence_comment", {
    p_occurrence_id: input.occurrenceId,
    p_content: input.content,
  });

  if (error) {
    throw new Error("Não foi possível enviar o comentário.");
  }

  const result = assertRpcSuccess<RpcCreateCommentResponse>(
    data,
    "Não foi possível enviar o comentário.",
  );

  return { comment: result.comment };
}
