import {
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  type OccurrenceAttachmentMimeType,
} from "@safestop/types";
import * as ImageManipulator from "expo-image-manipulator";

import type { PickedEvidenceAsset } from "../types";
import { resolveLocalFileSize } from "../utils/resolve-local-file-size";

/**
 * PO-10 — compressão mobile (docs/engineering.md §32.4).
 * Re-encode JPEG remove EXIF; limita dimensão e tamanho final (≤ 10 MiB).
 */
export const EVIDENCE_COMPRESS_MAX_WIDTH = 1920;
export const EVIDENCE_COMPRESS_JPEG_QUALITY = 0.82;

function inferMimeType(uri: string): OccurrenceAttachmentMimeType {
  const lower = uri.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function buildFileName(mimeType: OccurrenceAttachmentMimeType): string {
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

  return `evidencia-${Date.now()}.${extension}`;
}

async function compressOnce(
  uri: string,
  quality: number,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: EVIDENCE_COMPRESS_MAX_WIDTH } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

export async function compressEvidenceImage(sourceUri: string): Promise<PickedEvidenceAsset> {
  let quality = EVIDENCE_COMPRESS_JPEG_QUALITY;
  let compressed = await compressOnce(sourceUri, quality);
  let fileSize = await resolveLocalFileSize(compressed.uri, null);

  while (fileSize > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES && quality > 0.4) {
    quality -= 0.1;
    compressed = await compressOnce(compressed.uri, quality);
    fileSize = await resolveLocalFileSize(compressed.uri, null);
  }

  if (fileSize > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error("Imagem excede 10 MiB mesmo após compressão.");
  }

  const mimeType: OccurrenceAttachmentMimeType = "image/jpeg";

  return {
    uri: compressed.uri,
    fileName: buildFileName(mimeType),
    mimeType,
    fileSize,
    width: compressed.width,
    height: compressed.height,
  };
}

export function resolvePickerMimeType(
  assetMimeType: string | undefined,
  uri: string,
): OccurrenceAttachmentMimeType {
  if (
    assetMimeType === "image/jpeg" ||
    assetMimeType === "image/png" ||
    assetMimeType === "image/webp"
  ) {
    return assetMimeType;
  }

  return inferMimeType(uri);
}
