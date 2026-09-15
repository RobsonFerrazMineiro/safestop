import { isOccurrenceAttachmentMimeType, type OccurrenceAttachmentMimeType } from "@safestop/types";

/** Subconjunto de imagem da allowlist compartilhada (`@safestop/types`). */
export const EVIDENCE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const satisfies readonly OccurrenceAttachmentMimeType[];

export type EvidenceImageMimeType = (typeof EVIDENCE_IMAGE_MIME_TYPES)[number];

export function isEvidenceImageMimeType(value: string): value is EvidenceImageMimeType {
  return (EVIDENCE_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function isEvidencePdfMimeType(value: string): value is "application/pdf" {
  return value === "application/pdf";
}

export function isAcceptedEvidenceMimeType(value: string): value is OccurrenceAttachmentMimeType {
  return isOccurrenceAttachmentMimeType(value);
}

export function getEvidenceRepresentationKind(mimeType: string): "image" | "document" {
  return isEvidencePdfMimeType(mimeType) ? "document" : "image";
}
