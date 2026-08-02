import type { UpdateOccurrenceCommentResult } from "@safestop/types";
import type { UpdateOccurrenceCommentInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcUpdateCommentResponse = {
  comment: UpdateOccurrenceCommentResult["comment"];
};

export async function updateOccurrenceComment(
  input: UpdateOccurrenceCommentInput,
): Promise<UpdateOccurrenceCommentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("update_occurrence_comment", {
    p_comment_id: input.commentId,
    p_content: input.content,
  });

  if (error) {
    throw new Error("Não foi possível salvar o comentário.");
  }

  const envelope = data as { success?: boolean; error?: { code?: string; message?: string } };

  if (envelope.success === false && envelope.error?.code === "FORBIDDEN") {
    throw new Error("O prazo para editar este comentário expirou.");
  }

  const result = assertRpcSuccess<RpcUpdateCommentResponse>(
    data,
    "Não foi possível salvar o comentário.",
  );

  return { comment: result.comment };
}
