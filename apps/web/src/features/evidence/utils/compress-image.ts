import {
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  type OccurrenceAttachmentMimeType,
} from "@safestop/types";

import { EVIDENCE_IMAGE_MIME_TYPES } from "./is-evidence-mime";

const MAX_IMAGE_DIMENSION_PX = 1920;
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.85;

export type CompressedImage = {
  blob: Blob;
  mimeType: OccurrenceAttachmentMimeType;
  fileName: string;
  fileSize: number;
};

function getOutputMimeType(sourceMimeType: string): OccurrenceAttachmentMimeType {
  if (sourceMimeType === "image/png") {
    return "image/png";
  }

  if (sourceMimeType === "image/webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function replaceExtension(fileName: string, mimeType: OccurrenceAttachmentMimeType): string {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "evidencia";
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

  return `${baseName}.${extension}`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível processar a imagem."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: OccurrenceAttachmentMimeType,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const quality =
      mimeType === "image/jpeg"
        ? JPEG_QUALITY
        : mimeType === "image/webp"
          ? WEBP_QUALITY
          : undefined;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível compactar a imagem."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Remove EXIF e reduz dimensão/tamanho antes do upload (engineering.md §32.4).
 * Somente imagens — PDF deve usar `prepareEvidenceFileForUpload`.
 */
export async function compressImageForUpload(file: File): Promise<CompressedImage> {
  if (!(EVIDENCE_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }

  if (file.size > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error("Arquivo excede o tamanho máximo permitido.");
  }

  const image = await loadImageFromFile(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = largestSide > MAX_IMAGE_DIMENSION_PX ? MAX_IMAGE_DIMENSION_PX / largestSide : 1;

  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível processar a imagem.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const outputMimeType = getOutputMimeType(file.type);
  const blob = await canvasToBlob(canvas, outputMimeType);

  if (blob.size > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error("Imagem ainda excede o tamanho máximo após compactação.");
  }

  return {
    blob,
    mimeType: outputMimeType,
    fileName: replaceExtension(file.name, outputMimeType),
    fileSize: blob.size,
  };
}
