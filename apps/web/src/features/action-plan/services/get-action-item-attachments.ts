import {
  ACTION_ITEM_ATTACHMENT_UPLOAD_STATUSES,
  type ActionItemAttachmentMimeType,
  type ActionItemAttachmentUploadStatus,
} from "@safestop/types";

function isUploadStatus(value: string): value is ActionItemAttachmentUploadStatus {
  return (ACTION_ITEM_ATTACHMENT_UPLOAD_STATUSES as readonly string[]).includes(value);
}

import { createClient } from "@/lib/auth/client";

import type { ActionItemAttachmentEnriched } from "../types";

type AttachmentRow = {
  id: string;
  action_item_id: string;
  organization_id: string;
  storage_bucket: string;
  storage_path: string;
  upload_status: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  created_at: string;
  uploaded_by: string;
};

function mapAttachmentRow(row: AttachmentRow): ActionItemAttachmentEnriched | null {
  if (!isUploadStatus(row.upload_status)) {
    return null;
  }

  const mimeType = row.mime_type as ActionItemAttachmentMimeType;
  const uploadStatus = row.upload_status;

  return {
    id: row.id,
    actionItemId: row.action_item_id,
    organizationId: row.organization_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    uploadStatus,
    mimeType,
    fileSize: row.file_size,
    caption: row.caption,
    createdAt: row.created_at,
    createdBy: row.uploaded_by,
  };
}

export async function getActionItemAttachments(
  organizationId: string,
  itemId: string,
): Promise<ActionItemAttachmentEnriched[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_item_attachments")
    .select(
      "id, action_item_id, organization_id, storage_bucket, storage_path, upload_status, mime_type, file_size, caption, created_at, uploaded_by",
    )
    .eq("organization_id", organizationId)
    .eq("action_item_id", itemId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as evidências da ação.");
  }

  return (data ?? [])
    .map((row) => mapAttachmentRow(row as AttachmentRow))
    .filter((item): item is ActionItemAttachmentEnriched => item !== null);
}
