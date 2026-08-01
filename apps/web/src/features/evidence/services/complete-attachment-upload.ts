import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcCompleteResult = {
  attachment_id: string;
  upload_status: "COMPLETED";
};

export async function completeOccurrenceAttachmentUpload(attachmentId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("complete_occurrence_attachment_upload", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o envio da evidência.");
  }

  assertRpcSuccess<RpcCompleteResult>(data, "Não foi possível concluir o envio da evidência.");
}
