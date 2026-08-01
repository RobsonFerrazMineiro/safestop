import { getSupabaseClient } from "@/lib/auth/client";

import { assertRpcSuccess } from "../utils/rpc-response";

type RpcDeleteResult = {
  attachment_id: string;
  deleted_at: string;
};

export async function deleteOccurrenceAttachment(attachmentId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("delete_occurrence_attachment", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível remover a evidência.");
  }

  assertRpcSuccess<RpcDeleteResult>(data, "Não foi possível remover a evidência.");
}
