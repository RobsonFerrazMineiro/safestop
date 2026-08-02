import type {
  Json,
  OccurrenceComment,
  OccurrenceTimelineItem,
  TimelineCursorPayload,
} from "@safestop/types";
import { isOccurrenceTimelineEventKind } from "@safestop/types";

type RpcTimelineItem = {
  id: string;
  kind: string;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  title: string;
  body: string | null;
  metadata: Record<string, Json | undefined> | null;
};

type RpcComment = {
  id: string;
  organizationId: string;
  occurrenceId: string;
  authorId: string;
  commentType: string;
  content: string | null;
  isInternal: boolean;
  createdAt: string;
  editedAt: string | null;
  editedBy: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
};

export function mapTimelineItem(raw: RpcTimelineItem): OccurrenceTimelineItem | null {
  if (!isOccurrenceTimelineEventKind(raw.kind)) {
    return null;
  }

  if (raw.kind === "SYSTEM") {
    return null;
  }

  return {
    id: raw.id,
    kind: raw.kind,
    occurredAt: raw.occurredAt,
    actorId: raw.actorId,
    actorName: raw.actorName,
    title: raw.title,
    body: raw.body,
    metadata: raw.metadata ?? {},
  };
}

export function mapTimelineCursor(
  cursor: TimelineCursorPayload | null | undefined,
): TimelineCursorPayload | null {
  if (!cursor?.occurred_at || !cursor.id) {
    return null;
  }

  return {
    occurred_at: cursor.occurred_at,
    id: cursor.id,
  };
}

export function mapOccurrenceComment(raw: RpcComment): OccurrenceComment {
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    occurrenceId: raw.occurrenceId,
    authorId: raw.authorId,
    commentType: raw.commentType as OccurrenceComment["commentType"],
    content: raw.content,
    isInternal: raw.isInternal,
    createdAt: raw.createdAt,
    editedAt: raw.editedAt,
    editedBy: raw.editedBy,
    deletedAt: raw.deletedAt ?? null,
    deletedBy: raw.deletedBy ?? null,
  };
}
