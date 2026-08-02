import {
  OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS,
  type OccurrenceStatus,
  type OccurrenceTimelineItem,
} from "@safestop/types";

const BLOCKED_COMMENT_STATUSES: OccurrenceStatus[] = ["ENCERRADA", "CANCELADA"];

export function isCommentingBlocked(status: OccurrenceStatus): boolean {
  return BLOCKED_COMMENT_STATUSES.includes(status);
}

export function canComment(params: {
  canRead: boolean;
  occurrenceStatus: OccurrenceStatus;
  isOnline: boolean;
}): boolean {
  return params.canRead && !isCommentingBlocked(params.occurrenceStatus) && params.isOnline;
}

export function canEditComment(params: {
  item: OccurrenceTimelineItem;
  currentUserId: string | undefined;
  occurrenceStatus: OccurrenceStatus;
}): boolean {
  if (params.item.kind !== "COMMENT_ADDED") {
    return false;
  }

  if (isCommentingBlocked(params.occurrenceStatus)) {
    return false;
  }

  if (!params.currentUserId || params.item.actorId !== params.currentUserId) {
    return false;
  }

  if (params.item.metadata.isRemoved === true) {
    return false;
  }

  const createdAt = params.item.occurredAt;
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const windowMs = OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS * 60 * 60 * 1000;

  return elapsedMs <= windowMs;
}

export function canDeleteComment(params: {
  item: OccurrenceTimelineItem;
  currentUserId: string | undefined;
  canCancelOccurrence: boolean;
  occurrenceStatus: OccurrenceStatus;
}): boolean {
  if (params.item.kind !== "COMMENT_ADDED") {
    return false;
  }

  if (isCommentingBlocked(params.occurrenceStatus)) {
    return false;
  }

  if (params.item.metadata.isRemoved === true) {
    return false;
  }

  const isAuthor =
    params.currentUserId !== undefined && params.item.actorId === params.currentUserId;

  return isAuthor || params.canCancelOccurrence;
}

export function getCommentId(item: OccurrenceTimelineItem): string | null {
  const commentId = item.metadata.commentId;

  if (typeof commentId === "string" && commentId.length > 0) {
    return commentId;
  }

  return item.kind === "COMMENT_ADDED" ? item.id : null;
}

export function getEvidenceAttachmentId(item: OccurrenceTimelineItem): string | null {
  const attachmentId = item.metadata.attachmentId;

  if (typeof attachmentId === "string" && attachmentId.length > 0) {
    return attachmentId;
  }

  return null;
}
