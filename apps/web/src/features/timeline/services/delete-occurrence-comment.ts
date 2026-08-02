import type { DeleteOccurrenceCommentResult } from "@safestop/types";

import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcDeleteCommentResponse = {
  comment: DeleteOccurrenceCommentResult["comment"];
};

export type DeleteOccurrenceCommentParams = {
  commentId: string;
};

export async function deleteOccurrenceComment(
  input: DeleteOccurrenceCommentParams,
): Promise<DeleteOccurrenceCommentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("delete_occurrence_comment", {
    p_comment_id: input.commentId,
  });

  if (error) {
    throw new Error("Não foi possível remover o comentário.");
  }

  const envelope = data as { success?: boolean; error?: { code?: string; message?: string } };

  if (envelope.success === false && envelope.error?.code === "FORBIDDEN") {
    throw new Error("Você não tem permissão para remover este comentário.");
  }

  const result = assertRpcSuccess<RpcDeleteCommentResponse>(
    data,
    "Não foi possível remover o comentário.",
  );

  return { comment: result.comment };
}
