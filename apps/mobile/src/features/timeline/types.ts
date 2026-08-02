import type {
  GetOccurrenceTimelineResult,
  OccurrenceTimelineItem,
  TimelineCursorPayload,
} from "@safestop/types";
import {
  isOccurrenceTimelineEventKind,
  OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE,
} from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

export const TIMELINE_SCOPE = "timeline" as const;

export const timelineQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, TIMELINE_SCOPE] as const,
  occurrence: (organizationId: string, occurrenceId: string) =>
    [...timelineQueryKeys.all(organizationId), occurrenceId] as const,
};

export type { OccurrenceTimelineItem, GetOccurrenceTimelineResult, TimelineCursorPayload };

export { OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE };

export function isTimelineItem(value: unknown): value is OccurrenceTimelineItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as OccurrenceTimelineItem;
  return (
    typeof item.id === "string" &&
    typeof item.kind === "string" &&
    isOccurrenceTimelineEventKind(item.kind) &&
    typeof item.occurredAt === "string" &&
    typeof item.title === "string"
  );
}
