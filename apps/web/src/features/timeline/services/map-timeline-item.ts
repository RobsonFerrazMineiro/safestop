import type { OccurrenceTimelineItem } from "@safestop/types";
import { isOccurrenceTimelineEventKind } from "@safestop/types";

type RpcTimelineItem = {
  id: string;
  kind: string;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
};

export function mapTimelineItem(raw: RpcTimelineItem): OccurrenceTimelineItem | null {
  if (!isOccurrenceTimelineEventKind(raw.kind)) {
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
    metadata: (raw.metadata ?? {}) as OccurrenceTimelineItem["metadata"],
  };
}

export function getTimelineItemTitle(item: OccurrenceTimelineItem): string {
  switch (item.kind) {
    case "OCCURRENCE_CREATED":
      return "Paralisação registrada";
    case "COMMENT_REMOVED":
      return "Comentário removido";
    case "EVIDENCE_REMOVED":
      return "Evidência removida";
    case "COMMENT_ADDED":
      return item.actorName ?? "Usuário";
    case "EVIDENCE_ADDED": {
      const fileName = item.metadata.originalFileName;
      return typeof fileName === "string" && fileName.length > 0 ? fileName : item.title;
    }
    default:
      return item.title;
  }
}

export function getMetadataString(
  metadata: OccurrenceTimelineItem["metadata"],
  key: string,
): string | null {
  const value = metadata[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export function getMetadataBoolean(
  metadata: OccurrenceTimelineItem["metadata"],
  key: string,
): boolean {
  return metadata[key] === true;
}
