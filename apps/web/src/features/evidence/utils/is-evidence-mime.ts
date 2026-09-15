import { isOccurrenceAttachmentMimeType, type OccurrenceAttachmentMimeType } from "@safestop/types";

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

export function isAcceptedEvidenceFile(file: File): boolean {
  return isOccurrenceAttachmentMimeType(file.type);
}
