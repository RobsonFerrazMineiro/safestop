/**
 * Tipos de domínio para evidências de ocorrência (Sprint 2.2).
 * Referência: docs/database.md §13.1, §24
 */

export const OCCURRENCE_ATTACHMENT_BUCKET = "occurrence-evidence" as const;

export const OCCURRENCE_ATTACHMENT_TYPES = [
  "INITIAL_EVIDENCE",
  "CORRECTION_EVIDENCE",
  "RELEASE_EVIDENCE",
  "DOCUMENT",
  "OTHER",
] as const;

export type OccurrenceAttachmentType = (typeof OCCURRENCE_ATTACHMENT_TYPES)[number];

export const OCCURRENCE_ATTACHMENT_UPLOAD_STATUSES = ["PENDING", "COMPLETED", "FAILED"] as const;

export type OccurrenceAttachmentUploadStatus =
  (typeof OCCURRENCE_ATTACHMENT_UPLOAD_STATUSES)[number];

export const OCCURRENCE_ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type OccurrenceAttachmentMimeType = (typeof OCCURRENCE_ATTACHMENT_MIME_TYPES)[number];

/** 10 MiB — alinhado à migration e bucket Storage */
export const OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Máximo de evidências ativas (PENDING + COMPLETED) por ocorrência */
export const OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE = 20;

/** TTL centralizado para URLs assinadas (docs/engineering.md §18.12) */
export const OCCURRENCE_ATTACHMENT_SIGNED_URL_TTL_SECONDS = 3600;

export const OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH = 500;

export type OccurrenceAttachmentSummary = {
  id: string;
  occurrenceId: string;
  organizationId: string;
  attachmentType: OccurrenceAttachmentType;
  originalFileName: string;
  mimeType: OccurrenceAttachmentMimeType;
  fileSize: number;
  caption: string | null;
  uploadStatus: OccurrenceAttachmentUploadStatus;
  createdAt: string;
};

export type PrepareOccurrenceAttachmentUploadResult = {
  attachmentId: string;
  bucket: typeof OCCURRENCE_ATTACHMENT_BUCKET;
  storagePath: string;
  uploadStatus: "PENDING";
};

export type OccurrenceAttachmentSignedUrlResult = {
  attachmentId: string;
  bucket: typeof OCCURRENCE_ATTACHMENT_BUCKET;
  storagePath: string;
  expiresInSeconds: typeof OCCURRENCE_ATTACHMENT_SIGNED_URL_TTL_SECONDS;
  expiresAt: string;
  signedUrl: string | null;
};

export function isOccurrenceAttachmentType(value: string): value is OccurrenceAttachmentType {
  return (OCCURRENCE_ATTACHMENT_TYPES as readonly string[]).includes(value);
}

export function isOccurrenceAttachmentMimeType(
  value: string,
): value is OccurrenceAttachmentMimeType {
  return (OCCURRENCE_ATTACHMENT_MIME_TYPES as readonly string[]).includes(value);
}

export function isOccurrenceAttachmentUploadStatus(
  value: string,
): value is OccurrenceAttachmentUploadStatus {
  return (OCCURRENCE_ATTACHMENT_UPLOAD_STATUSES as readonly string[]).includes(value);
}
