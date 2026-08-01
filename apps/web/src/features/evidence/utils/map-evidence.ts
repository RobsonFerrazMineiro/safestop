import type { OccurrenceAttachmentSummary } from "@safestop/types";
import {
  isOccurrenceAttachmentMimeType,
  isOccurrenceAttachmentType,
  isOccurrenceAttachmentUploadStatus,
} from "@safestop/types";

import type { EvidenceListItem } from "../types";

type OccurrenceAttachmentRow = {
  id: string;
  occurrence_id: string;
  organization_id: string;
  attachment_type: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  upload_status: string;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function resolveUploadedByName(profiles: OccurrenceAttachmentRow["profiles"]): string | null {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name ?? null;
  }

  return profiles.full_name;
}

function mapSummary(row: OccurrenceAttachmentRow): OccurrenceAttachmentSummary | null {
  if (
    !isOccurrenceAttachmentType(row.attachment_type) ||
    !isOccurrenceAttachmentMimeType(row.mime_type) ||
    !isOccurrenceAttachmentUploadStatus(row.upload_status)
  ) {
    return null;
  }

  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    organizationId: row.organization_id,
    attachmentType: row.attachment_type,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    caption: row.caption,
    uploadStatus: row.upload_status,
    createdAt: row.created_at,
  };
}

export function mapOccurrenceAttachmentRow(row: OccurrenceAttachmentRow): EvidenceListItem | null {
  const summary = mapSummary(row);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    uploadedByName: resolveUploadedByName(row.profiles),
  };
}
