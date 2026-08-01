import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcDeleteResult = {
  attachment_id: string;
  deleted_at: string;
};

export async function deleteOccurrenceAttachment(attachmentId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("delete_occurrence_attachment", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível remover a evidência.");
  }

  assertRpcSuccess<RpcDeleteResult>(data, "Não foi possível remover a evidência.");
}
