import type { OccurrenceAttachmentSummary } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

/** Lista tenant-scoped — 30s (alinhado a occurrences list). */
export const EVIDENCE_LIST_STALE_TIME_MS = 30_000;

/** URL assinada — regenerar antes do TTL de 3600s. */
export const EVIDENCE_SIGNED_URL_STALE_TIME_MS = 50 * 60 * 1000;

/** Tile fixo 80×80 (EVIDENCE-UI-SPEC.md). */
export const EVIDENCE_TILE_SIZE_CLASS = "h-20 w-20 shrink-0";

export type EvidenceUploadPhase =
  "preparing" | "uploading" | "registering" | "completed" | "failed";

export type EvidenceUploadQueueItem = {
  localId: string;
  file: File;
  fileName: string;
  previewUrl: string;
  phase: EvidenceUploadPhase;
  progress: number;
  errorMessage: string | null;
  attachmentId: string | null;
};

export type EvidenceListItem = OccurrenceAttachmentSummary & {
  uploadedByName: string | null;
};

export function evidenceQueryKeys(organizationId: string, occurrenceId: string) {
  const root = [
    TENANT_QUERY_KEY_PREFIX,
    organizationId,
    "occurrences",
    occurrenceId,
    "evidence",
  ] as const;

  return {
    all: root,
    list: () => [...root, "list"] as const,
    signedUrl: (attachmentId: string) => [...root, "signed-url", attachmentId] as const,
  };
}

export type OccurrenceEvidenceList = EvidenceListItem[];
