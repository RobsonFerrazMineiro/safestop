import {
  ACTION_ITEM_ATTACHMENT_MIME_TYPES,
  isActionItemPriority,
  isActionItemStatus,
  isActionPlanStatus,
  type ActionItem,
  type ActionItemAttachmentMimeType,
} from "@safestop/types";

import type {
  ActionItemEnriched,
  ActionItemAttachmentEnriched,
  ActionPlanEnriched,
} from "../types";

type ProfileJoin = { full_name: string | null };

type ActionPlanRow = {
  id: string;
  occurrence_id: string;
  organization_id: string;
  status: string;
  summary: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  closed_at: string | null;
};

type ActionItemRow = {
  id: string;
  action_plan_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  responsible_member_id: string;
  responsible_organization_id: string;
  due_at: string;
  priority: string;
  status: string;
  completion_description: string | null;
  completed_at: string | null;
  completed_by: string | null;
  validated_at: string | null;
  validated_by: string | null;
  validation_note: string | null;
  created_at: string;
  updated_at: string;
  responsible_member?:
    | { profiles: ProfileJoin | ProfileJoin[] | null }
    | { profiles: ProfileJoin | ProfileJoin[] | null }[]
    | null;
};

type AttachmentRow = {
  id: string;
  action_item_id: string;
  organization_id: string;
  storage_bucket: string;
  storage_path: string;
  original_file_name: string;
  upload_status: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  created_at: string;
  /** Coluna persistida — NOT NULL no schema. */
  uploaded_by: string;
};

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function mapActionPlanRow(row: ActionPlanRow): ActionPlanEnriched | null {
  if (!isActionPlanStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    organizationId: row.organization_id,
    status: row.status,
    summary: row.summary,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

export function mapActionItemRow(row: ActionItemRow): ActionItemEnriched | null {
  if (!isActionItemStatus(row.status) || !isActionItemPriority(row.priority)) {
    return null;
  }

  const member = normalizeJoin(
    Array.isArray(row.responsible_member)
      ? row.responsible_member[0]
      : (row.responsible_member ?? null),
  );
  const profile = normalizeJoin(member?.profiles ?? null);

  const item: ActionItem = {
    id: row.id,
    actionPlanId: row.action_plan_id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    responsibleMemberId: row.responsible_member_id,
    responsibleOrganizationId: row.responsible_organization_id,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    completionDescription: row.completion_description,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
    validationNote: row.validation_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    ...item,
    responsibleMemberName: profile?.full_name ?? null,
  };
}

function isAttachmentMimeType(value: string): value is ActionItemAttachmentMimeType {
  return (ACTION_ITEM_ATTACHMENT_MIME_TYPES as readonly string[]).includes(value);
}

export function mapActionItemAttachmentRow(
  row: AttachmentRow,
): ActionItemAttachmentEnriched | null {
  if (
    row.upload_status !== "PENDING" &&
    row.upload_status !== "COMPLETED" &&
    row.upload_status !== "FAILED"
  ) {
    return null;
  }

  if (!isAttachmentMimeType(row.mime_type)) {
    return null;
  }

  return {
    id: row.id,
    actionItemId: row.action_item_id,
    organizationId: row.organization_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    uploadStatus: row.upload_status,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    caption: row.caption,
    createdAt: row.created_at,
    createdBy: row.uploaded_by,
    originalFileName: row.original_file_name,
  };
}
