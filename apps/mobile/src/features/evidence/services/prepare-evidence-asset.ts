import {
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  isOccurrenceAttachmentMimeType,
} from "@safestop/types";

import type { PickedEvidenceAsset } from "../types";
import { isEvidenceImageMimeType, isEvidencePdfMimeType } from "../utils/is-evidence-mime";
import { resolveLocalFileSize } from "../utils/resolve-local-file-size";

import { compressEvidenceImage, resolvePickerMimeType } from "./compress-image";

export const EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE = "Use arquivos JPG, PNG, WebP ou PDF.";

export const EVIDENCE_MAX_SIZE_MESSAGE = `Arquivo deve ter no máximo ${OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MiB.`;

export const EVIDENCE_PDF_MIME_REQUIRED_MESSAGE =
  "O documento precisa ser um PDF válido (application/pdf).";

export type EvidenceSourceAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

/**
 * Prepara asset para upload: imagens passam por ImageManipulator/compressão;
 * PDF valida e sobe direto, preservando MIME, nome e tamanho.
 */
export async function prepareEvidenceAssetForUpload(
  source: EvidenceSourceAsset,
): Promise<PickedEvidenceAsset> {
  const rawMime = source.mimeType?.trim() ?? "";

  if (isEvidencePdfMimeType(rawMime)) {
    const fileSize = await resolveLocalFileSize(source.uri, source.fileSize);

    if (fileSize > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
      throw new Error(EVIDENCE_MAX_SIZE_MESSAGE);
    }

    return {
      uri: source.uri,
      fileName: source.fileName?.trim() || "evidencia.pdf",
      mimeType: "application/pdf",
      fileSize,
      width: null,
      height: null,
    };
  }

  // MIME ausente/inválido em URI .pdf: NÃO assumir PDF pela extensão.
  if (!rawMime && source.uri.toLowerCase().includes(".pdf")) {
    throw new Error(EVIDENCE_PDF_MIME_REQUIRED_MESSAGE);
  }

  if (rawMime && !isOccurrenceAttachmentMimeType(rawMime) && !isEvidenceImageMimeType(rawMime)) {
    throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
  }

  const imageMime = resolvePickerMimeType(
    isEvidenceImageMimeType(rawMime) ? rawMime : undefined,
    source.uri,
  );

  if (!isEvidenceImageMimeType(imageMime)) {
    throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
  }

  if (
    typeof source.fileSize === "number" &&
    source.fileSize > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES
  ) {
    throw new Error(EVIDENCE_MAX_SIZE_MESSAGE);
  }

  return compressEvidenceImage(source.uri);
}
