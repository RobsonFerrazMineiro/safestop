import {
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  isOccurrenceAttachmentMimeType,
  type OccurrenceAttachmentMimeType,
} from "@safestop/types";

import { compressImageForUpload } from "./compress-image";
import { isEvidencePdfMimeType } from "./is-evidence-mime";

export const EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE = "Use arquivos JPG, PNG, WebP ou PDF.";

export const EVIDENCE_MAX_SIZE_MESSAGE = `Arquivo deve ter no máximo ${OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MiB.`;

export type PreparedEvidenceFile = {
  blob: Blob;
  mimeType: OccurrenceAttachmentMimeType;
  fileName: string;
  fileSize: number;
};

/**
 * Prepara arquivo para upload: imagens passam por compressão;
 * PDF preserva bytes e MIME sem Canvas.
 */
export async function prepareEvidenceFileForUpload(file: File): Promise<PreparedEvidenceFile> {
  if (!isOccurrenceAttachmentMimeType(file.type)) {
    throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
  }

  if (file.size > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error(EVIDENCE_MAX_SIZE_MESSAGE);
  }

  if (isEvidencePdfMimeType(file.type)) {
    return {
      blob: file,
      mimeType: "application/pdf",
      fileName: file.name.trim() || "evidencia.pdf",
      fileSize: file.size,
    };
  }

  return compressImageForUpload(file);
}
