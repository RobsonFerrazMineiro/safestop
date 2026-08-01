import type { OccurrenceAttachmentType } from "@safestop/types";
import { prepareAttachmentUploadSchema } from "@safestop/validation";

import { completeOccurrenceAttachmentUpload } from "./complete-attachment-upload";
import { failOccurrenceAttachmentUpload } from "./fail-attachment-upload";
import { prepareOccurrenceAttachmentUpload } from "./prepare-attachment-upload";
import { uploadToStorageWithProgress } from "./upload-to-storage";
import type { EvidenceUploadPhase } from "../types";
import { compressImageForUpload } from "../utils/compress-image";

export type UploadEvidenceFileInput = {
  occurrenceId: string;
  file: File;
  attachmentType?: OccurrenceAttachmentType;
  caption?: string;
  onPhaseChange?: (phase: EvidenceUploadPhase) => void;
  onProgress?: (percent: number) => void;
};

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

  const compressed = await compressImageForUpload(file);
  onProgress?.(15);

  const payload = prepareAttachmentUploadSchema.parse({
    occurrenceId,
    attachmentType,
    originalFileName: compressed.fileName,
    mimeType: compressed.mimeType,
    fileSize: compressed.fileSize,
    caption,
  });

  const prepared = await prepareOccurrenceAttachmentUpload(payload);
  onProgress?.(20);

  onPhaseChange?.("uploading");

  try {
    await uploadToStorageWithProgress({
      bucket: prepared.bucket,
      storagePath: prepared.storagePath,
      body: compressed.blob,
      mimeType: compressed.mimeType,
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
