import type {
  OccurrenceAttachmentMimeType,
  OccurrenceAttachmentSummary,
  OccurrenceAttachmentType,
} from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

export const EVIDENCE_SCOPE = "evidence" as const;
export const EVIDENCE_LIST_STALE_TIME_MS = 30_000;
export const EVIDENCE_SIGNED_URL_STALE_TIME_MS = 50 * 60 * 1000;
export const EVIDENCE_BATCH_SELECTION_LIMIT = 10;

export const evidenceQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, EVIDENCE_SCOPE] as const,
  lists: (organizationId: string) => [...evidenceQueryKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, occurrenceId: string) =>
    [...evidenceQueryKeys.lists(organizationId), occurrenceId] as const,
  signedUrls: (organizationId: string, occurrenceId: string) =>
    [...evidenceQueryKeys.list(organizationId, occurrenceId), "signed-url"] as const,
  signedUrl: (organizationId: string, occurrenceId: string, attachmentId: string) =>
    [...evidenceQueryKeys.signedUrls(organizationId, occurrenceId), attachmentId] as const,
};

export type EvidenceUploadQueueStatus =
  "queued" | "compressing" | "preparing" | "uploading" | "completing" | "completed" | "failed";

export type EvidenceUploadQueueItem = {
  localId: string;
  occurrenceId: string;
  uri: string;
  previewUri: string;
  originalFileName: string;
  mimeType: OccurrenceAttachmentMimeType;
  fileSize: number;
  attachmentType: OccurrenceAttachmentType;
  status: EvidenceUploadQueueStatus;
  progress: number;
  error: string | null;
  attachmentId: string | null;
};

export type EvidenceListItem = OccurrenceAttachmentSummary & {
  uploadedByName: string | null;
};

export type PickedEvidenceAsset = {
  uri: string;
  fileName: string;
  mimeType: OccurrenceAttachmentMimeType;
  fileSize: number;
  width: number | null;
  height: number | null;
};
