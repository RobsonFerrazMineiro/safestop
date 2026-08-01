import type { PrepareOccurrenceAttachmentUploadResult } from "@safestop/types";
import type { PrepareAttachmentUploadInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcPrepareResult = {
  attachment_id: string;
  bucket: "occurrence-evidence";
  storage_path: string;
  upload_status: "PENDING";
};

function mapInputToRpcPayload(input: PrepareAttachmentUploadInput) {
  return {
    occurrence_id: input.occurrenceId,
    attachment_type: input.attachmentType,
    original_file_name: input.originalFileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    caption: input.caption,
    latitude: input.latitude,
    longitude: input.longitude,
    captured_at: input.capturedAt,
  };
}

export async function prepareOccurrenceAttachmentUpload(
  input: PrepareAttachmentUploadInput,
): Promise<PrepareOccurrenceAttachmentUploadResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("prepare_occurrence_attachment_upload", {
    payload: mapInputToRpcPayload(input),
  });

  if (error) {
    throw new Error("Não foi possível preparar o envio da evidência.");
  }

  const prepared = assertRpcSuccess<RpcPrepareResult>(
    data,
    "Não foi possível preparar o envio da evidência.",
  );

  return {
    attachmentId: prepared.attachment_id,
    bucket: prepared.bucket,
    storagePath: prepared.storage_path,
    uploadStatus: prepared.upload_status,
  };
}
