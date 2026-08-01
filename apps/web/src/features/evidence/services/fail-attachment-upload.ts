import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcFailResult = {
  attachment_id: string;
  upload_status: "FAILED";
};

export async function failOccurrenceAttachmentUpload(
  attachmentId: string,
  failureReason?: string,
): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("fail_occurrence_attachment_upload", {
    target_attachment_id: attachmentId,
    failure_reason: failureReason ?? null,
  });

  if (error) {
    return;
  }

  assertRpcSuccess<RpcFailResult>(data, "Não foi possível registrar a falha do upload.");
}
