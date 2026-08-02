import type {
  GetOccurrenceTimelineResult,
  OccurrenceTimelineItem,
  TimelineCursorPayload,
} from "@safestop/types";

export type { GetOccurrenceTimelineResult, OccurrenceTimelineItem, TimelineCursorPayload };

export type TimelinePage = GetOccurrenceTimelineResult;

export type TimelineCommentActionsContext = {
  occurrenceId: string;
  organizationId: string;
  occurrenceStatus: string;
  userId: string | undefined;
};
