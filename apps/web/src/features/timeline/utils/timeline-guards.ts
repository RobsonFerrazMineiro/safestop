import {
  OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS,
  type OccurrenceStatus,
  type OccurrenceTimelineItem,
} from "@safestop/types";

import { getMetadataString } from "../services/map-timeline-item";

const TERMINAL_STATUSES: OccurrenceStatus[] = ["ENCERRADA", "CANCELADA"];

export function isTerminalOccurrenceStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function canCommentOnOccurrence(status: string, canRead: boolean): boolean {
  return canRead && !isTerminalOccurrenceStatus(status);
}

export function canEditTimelineComment(
  item: OccurrenceTimelineItem,
  userId: string | undefined,
  occurrenceStatus: string,
): boolean {
  if (item.kind !== "COMMENT_ADDED" || !userId) {
    return false;
  }

  if (isTerminalOccurrenceStatus(occurrenceStatus)) {
    return false;
  }

  if (item.actorId !== userId) {
    return false;
  }

  const createdAt = new Date(item.occurredAt).getTime();
  const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);

  return elapsedHours <= OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS;
}

export function canDeleteTimelineComment(
  item: OccurrenceTimelineItem,
  userId: string | undefined,
  occurrenceStatus: string,
  canCancel: boolean,
): boolean {
  if (item.kind !== "COMMENT_ADDED" || !userId) {
    return false;
  }

  if (isTerminalOccurrenceStatus(occurrenceStatus)) {
    return false;
  }

  return item.actorId === userId || canCancel;
}

export function getTimelineCommentId(item: OccurrenceTimelineItem): string | null {
  return getMetadataString(item.metadata, "commentId") ?? item.id;
}
