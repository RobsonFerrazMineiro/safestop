import type { OccurrenceAttachmentType } from "@safestop/types";
import { prepareAttachmentUploadSchema } from "@safestop/validation";

import { completeOccurrenceAttachmentUpload } from "./complete-attachment-upload";
import { failOccurrenceAttachmentUpload } from "./fail-attachment-upload";
import { prepareOccurrenceAttachmentUpload } from "./prepare-attachment-upload";
import { uploadToStorageWithProgress } from "./upload-to-storage";
import type { EvidenceUploadPhase } from "../types";
import { prepareEvidenceFileForUpload } from "../utils/prepare-evidence-file";

export type UploadEvidenceFileInput = {
  occurrenceId: string;
  file: File;
  attachmentType?: OccurrenceAttachmentType;
  caption?: string;
  onPhaseChange?: (phase: EvidenceUploadPhase) => void;
  onProgress?: (percent: number) => void;
};

/**
 * Upload de evidência de ocorrência.
 * PDF e imagens usam o mesmo RPC; PDF não passa por compressão de imagem.
 * attachmentType permanece INITIAL_EVIDENCE (uploader não escolhe tipo).
 */
export async function uploadEvidenceFile({
  occurrenceId,
  file,
  attachmentType = "INITIAL_EVIDENCE",
  caption,
  onPhaseChange,
  onProgress,
}: UploadEvidenceFileInput): Promise<string> {
  onPhaseChange?.("preparing");
  onProgress?.(5);

  const preparedFile = await prepareEvidenceFileForUpload(file);
  onProgress?.(15);

  const payload = prepareAttachmentUploadSchema.parse({
    occurrenceId,
    attachmentType,
    originalFileName: preparedFile.fileName,
    mimeType: preparedFile.mimeType,
    fileSize: preparedFile.fileSize,
    caption,
  });

  const prepared = await prepareOccurrenceAttachmentUpload(payload);
  onProgress?.(20);

  onPhaseChange?.("uploading");

  try {
    await uploadToStorageWithProgress({
      bucket: prepared.bucket,
      storagePath: prepared.storagePath,
      body: preparedFile.blob,
      mimeType: preparedFile.mimeType,
      onProgress: (storagePercent) => {
        const mapped = 20 + Math.round(storagePercent * 0.65);
        onProgress?.(mapped);
      },
    });
  } catch (error) {
    await failOccurrenceAttachmentUpload(prepared.attachmentId, "Falha no envio para o Storage.");
    throw error;
  }

  onPhaseChange?.("registering");
  onProgress?.(90);

  try {
    await completeOccurrenceAttachmentUpload(prepared.attachmentId);
  } catch (completeError) {
    await failOccurrenceAttachmentUpload(prepared.attachmentId, "Falha ao concluir o upload.");
    throw completeError;
  }

  onProgress?.(100);
  return prepared.attachmentId;
}
