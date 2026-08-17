import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

import { uploadToStorageWithProgress } from "@/features/evidence/services/upload-to-storage";
import { compressImageForUpload } from "@/features/evidence/utils/compress-image";

type PrepareResult = {
  attachment_id: string;
  bucket: "occurrence-evidence";
  storage_path: string;
  upload_status: "PENDING";
};

export type UploadActionItemEvidenceInput = {
  actionItemId: string;
  file: File;
  caption?: string;
  onProgress?: (percent: number) => void;
};

export async function uploadActionItemEvidence({
  actionItemId,
  file,
  caption,
  onProgress,
}: UploadActionItemEvidenceInput): Promise<string> {
  const supabase = createClient();

  onProgress?.(5);
  const compressed = await compressImageForUpload(file);
  onProgress?.(15);

  const { data, error } = await supabase.rpc("prepare_action_item_attachment_upload", {
    payload: {
      action_item_id: actionItemId,
      original_file_name: compressed.fileName,
      mime_type: compressed.mimeType,
      file_size: compressed.fileSize,
      caption,
    },
  });

  if (error) {
    throw new Error("Não foi possível preparar o envio da evidência.");
  }

  const prepared = assertRpcSuccess<PrepareResult>(
    data,
    "Não foi possível preparar o envio da evidência.",
  );

  onProgress?.(20);

  try {
    await uploadToStorageWithProgress({
      bucket: prepared.bucket,
      storagePath: prepared.storage_path,
      body: compressed.blob,
      mimeType: compressed.mimeType,
      onProgress: (storagePercent) => {
        onProgress?.(20 + Math.round(storagePercent * 0.65));
      },
    });
  } catch (uploadError) {
    await supabase.rpc("fail_action_item_attachment_upload", {
      target_attachment_id: prepared.attachment_id,
      failure_reason: "Falha no envio para o Storage.",
    });
    throw uploadError;
  }

  onProgress?.(90);

  const { data: completeData, error: completeError } = await supabase.rpc(
    "complete_action_item_attachment_upload",
    { target_attachment_id: prepared.attachment_id },
  );

  if (completeError) {
    await supabase.rpc("fail_action_item_attachment_upload", {
      target_attachment_id: prepared.attachment_id,
      failure_reason: "Falha ao concluir o upload.",
    });
    throw new Error("Não foi possível concluir o envio da evidência.");
  }

  assertRpcSuccess(completeData, "Não foi possível concluir o envio da evidência.");

  onProgress?.(100);
  return prepared.attachment_id;
}
